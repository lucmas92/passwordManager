import time

from PyQt6 import QtWidgets, uic, QtCore
import sys
import pyperclip
from PyQt6.QtWidgets import QMessageBox

from PasswordManager import PasswordManager


class Ui(QtWidgets.QMainWindow):
    def __init__(self):
        self.cmd_key_pressed = False
        super(Ui, self).__init__()
        uic.loadUi('ui/mainwindow.ui', self)
        self.editMode = False
        self.searchInput = self.findChild(QtWidgets.QLineEdit, 'searchInput')
        self.searchInput.keyPressEvent = self.search_input_key_press_event

        self.searchButton = self.findChild(QtWidgets.QToolButton, 'searchButton')
        self.editButton = self.findChild(QtWidgets.QToolButton, 'editButton')
        self.deleteButton = self.findChild(QtWidgets.QToolButton, 'deleteButton')
        self.copyButton = self.findChild(QtWidgets.QPushButton, 'copyButton')
        self.siteLabel = self.findChild(QtWidgets.QLabel, 'siteLabel')
        self.logLabel = self.findChild(QtWidgets.QLabel, 'logLabel')
        self.logLabel.setText("")
        self.passwordCountLabel = self.findChild(QtWidgets.QLabel, 'PasswordCountLabel')
        self.lineUsername = self.findChild(QtWidgets.QLineEdit, 'usernameLineEdit')
        self.linePassword = self.findChild(QtWidgets.QLineEdit, 'passwordLineEdit')
        self.linePassword.keyPressEvent = self.password_key_press_event
        self.noteText = self.findChild(QtWidgets.QTextEdit, 'noteTextEdit')
        self.noteText.keyPressEvent = self.note_key_press_event
        self.noteText.keyReleaseEvent = self.note_key_release_event
        self.passwordsList = self.findChild(QtWidgets.QListWidget, 'passwordsListWidget')
        self.passwordsList.itemClicked.connect(self.password_selected)
        self.passwordsList.keyPressEvent = self.password_key_press_event
        self.searchButton.clicked.connect(self.search_button_pressed)
        self.editButton.clicked.connect(self.edit_button_pressed)
        self.deleteButton.clicked.connect(self.delete_button_pressed)
        self.copyButton.clicked.connect(self.copy_button_pressed)

        self.pm = PasswordManager()
        self.update_password_count()
        self.show()

    def search_input_key_press_event(self, event):
        key = event.key()
        if key == 16777220:
            site = self.searchInput.text()
            if site != "":
                self.search(site)
        else:
            QtWidgets.QLineEdit.keyPressEvent(self.searchInput, event)

        site = self.searchInput.text()
        self.update_password_list(site)

    def password_key_press_event(self, event):
        key = event.key()
        if key == 16777220:
            self.save()
        else:
            QtWidgets.QLineEdit.keyPressEvent(self.linePassword, event)

    def note_key_release_event(self, event):
        self.cmd_key_pressed = False

    def note_key_press_event(self, event):
        key = event.key()
        if key == 16777249:
            self.cmd_key_pressed = True
        elif self.cmd_key_pressed and key == 16777220:
            self.save()
            self.cmd_key_pressed = False
        else:
            self.cmd_key_pressed = False
            QtWidgets.QTextEdit.keyPressEvent(self.noteText, event)

    def password_key_press_event(self, event):
        key = event.key()
        current = self.passwordsList.selectedIndexes()[0].row() if len(self.passwordsList.selectedIndexes()) > 0 else 0
        if key == 16777237:
            current = current + 1 if current < self.passwordsList.count() - 1 else current
        elif key == 16777235:
            current = current - 1 if current > 0 else 0
        item = self.passwordsList.item(current)
        self.passwordsList.setCurrentItem(item)
        site = item.text()
        self.search(site)

    def password_selected(self, item):
        site = item.text()
        self.search(site)

    def update_password_list(self, filter=None):
        passwords = self.pm.get_all_passwords(filter)
        self.passwordsList.clear()
        for pwd in passwords:
            self.passwordsList.addItem(pwd['site'])

    def update_password_count(self):
        self.passwordCountLabel.setText(str(self.pm.get_password_count()))
        self.update_password_list()

    def save(self):
        self.editMode = False
        site = self.siteLabel.text()
        password = self.linePassword.text()
        username = self.lineUsername.text()
        note = self.noteText.toPlainText()
        self.pm.save_password(site, username, password, note)
        self.update_password_count()
        self.editButton.setStyleSheet("background-color: #0F0F0F")
        self.editButton.setText("Modifica")
        self.lineUsername.setStyleSheet("padding:10px;background-color: #0f0f0f")
        self.linePassword.setStyleSheet("padding:10px;background-color: #0f0f0f")
        self.lineUsername.setReadOnly(True)
        self.linePassword.setReadOnly(True)
        self.copyButton.setEnabled(True)
        self.noteText.setReadOnly(True)
        self.deleteButton.setEnabled(True)
        self.show_log("Password Salvata!")

    def hide_log(self):
        self.logLabel.setText("")

    def show_log(self, text):
        self.logLabel.setText(text)
        QtCore.QTimer.singleShot(1500, self.hide_log)

    def copy_button_pressed(self):
        pyperclip.copy(self.linePassword.text())
        self.show_log("Copiato negli appunti!")

    def delete_button_pressed(self):
        msg = "Sicuro di voler eliminare questa password?"
        msgBox = QtWidgets.QMessageBox()
        msgBox.setIcon(QtWidgets.QMessageBox.Icon.Information)
        msgBox.setText(msg)
        msgBox.setWindowTitle("New Window")
        msgBox.setStandardButtons(
            QtWidgets.QMessageBox.StandardButton.Ok | QtWidgets.QMessageBox.StandardButton.Cancel
        )
        response = msgBox.exec()
        if response == QtWidgets.QMessageBox.StandardButton.Ok:
            site = self.siteLabel.text()
            self.pm.delete_password(site)
            self.lineUsername.setText("")
            self.linePassword.setText("")
            self.noteText.setText("")
            self.searchInput.setText("")
            self.siteLabel.setText("Sito")
            self.deleteButton.setEnabled(False)
            self.show_log("Password Eliminata!")
            self.update_password_count()

    def edit_button_pressed(self):
        self.editMode = not self.editMode
        if self.editMode:
            self.editButton.setStyleSheet("background-color: green")
            self.editButton.setText("Salva")
            self.lineUsername.setStyleSheet("padding:10px;background-color: #090909")
            self.linePassword.setStyleSheet("padding:10px;background-color: #090909")
            self.lineUsername.setReadOnly(False)
            self.linePassword.setReadOnly(False)
            self.noteText.setReadOnly(False)
        else:
            self.save()

    def search(self, site):
        if site == "":
            return

        data = self.pm.get_password(site)
        self.siteLabel.setText(site if site != "" else "Sito")
        if data is None:
            self.deleteButton.setEnabled(False)
            self.copyButton.setEnabled(False)
            self.lineUsername.setText("")
            self.linePassword.setText("")
            self.noteText.setText("")
            self.show_log("Password non trovata!")
        else:
            self.copyButton.setEnabled(True)
            self.deleteButton.setEnabled(True)
            self.siteLabel.setText(data['site'])
            self.lineUsername.setText(data['username'])
            self.linePassword.setText(data['password'])
            self.noteText.setText(data['note'])

    def search_button_pressed(self):
        site = self.searchInput.text()
        self.search(site)


app = QtWidgets.QApplication(sys.argv)
window = Ui()
app.exec()
