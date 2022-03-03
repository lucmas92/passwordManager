from cryptography.fernet import Fernet
import sqlite3
import os
import zipfile

db_name = 'mydb.db'


class DB:
    def __init__(self):
        self.db = db_name
        if not os.path.isfile(self.db):
            with zipfile.ZipFile(db_name + ".zip", 'r') as zip_ref:
                zip_ref.extractall(os.getcwd())

    def get_value(self, query, value, params=None):
        row = self.get_row(query, params)
        return row[value]

    def get_row(self, query, params=None):
        if params is None:
            params = {}

        conn = sqlite3.connect(self.db)
        cur = conn.cursor()
        cur.execute(query, params)
        data = cur.fetchone()
        names = list(map(lambda x: x[0], cur.description))
        cur.close()
        if data is None:
            return None
        zip_iterator = zip(names, data)
        row = dict(zip_iterator)
        conn.close()
        return row

    def query(self, query, params=None):
        if params is None:
            params = {}

        conn = sqlite3.connect(self.db)
        cur = conn.cursor()
        cur.execute(query, params)
        data = cur.fetchall()
        if data is None:
            return None
        rows = []
        names = list(map(lambda x: x[0], cur.description))
        cur.close()
        conn.close()
        for row in data:
            zip_iterator = zip(names, row)
            rows.append(dict(zip_iterator))
        return rows

    def exec(self, query, params=()):
        conn = sqlite3.connect(self.db)
        cur = conn.cursor()
        cur.execute(query, params)
        conn.commit()
        cur.close()
        conn.close()


class PasswordRepository:

    def __init__(self):
        self.db = DB()

    def get_password(self, site):
        self.db = DB()
        row = self.db.get_row("select * from passwords where site like '%' || ? || '%';", (site,))
        return row

    def insert_password(self, site, username, password, note):
        self.db.exec(
            "INSERT INTO passwords (site, username, password, note) VALUES (?,?,?,?)",
            (site, username, password, note)
        )

    def delete_password(self, site):
        self.db.exec("DELETE FROM passwords WHERE site=?", (site,))

    def update_password(self, site, username, password, note):
        self.db.exec(
            "UPDATE passwords set username=?, password=?, note=? WHERE site=?",
            (username, password, note, site)
        )


class PasswordManager:

    def __init__(self):
        self.db = DB()
        self.password_repository = PasswordRepository()
        self.key = None
        self.password_file = None
        self.password_dict = {}
        self.load_key()

    def create_key(self):
        self.key = Fernet.generate_key()
        self.db.exec(
            "INSERT OR REPLACE INTO parameters (key, value) VALUES (?,?)",
            ('key', self.key)
        )

    def load_key(self):
        self.key = self.db.get_value(query="select value from parameters where key=:key", params={"key": "key"},
                                     value="value")
        if self.key is None:
            self.create_key()

    def encrypt(self, password):
        return Fernet(self.key).encrypt(password.encode())
        pass

    def decrypt(self, encrypted_password):
        return Fernet(self.key).decrypt(encrypted_password).decode('utf-8')
        pass

    def save_password(self, site, username, password, note=""):
        if self.get_password(site) is not None:
            self.update_password(site, username, password, note)
        else:
            self.insert_password(site, username, password, note)

    def update_password(self, site, username, password, note=""):
        self.password_repository.update_password(site, username, self.encrypt(password), self.encrypt(note))

    def insert_password(self, site, username, password, note=""):
        self.password_repository.insert_password(site, username, self.encrypt(password), self.encrypt(note))

    def delete_password(self, site):
        self.password_repository.delete_password(site)

    def get_password(self, site):
        data = self.password_repository.get_password(site)
        if data is None:
            return None
        data['password'] = self.decrypt(data['password']) if data and len(data['password']) > 0 else ""
        data['note'] = self.decrypt(data['note']) if data and len(data['note']) > 0 else ""
        return data

    def get_password_count(self):
        return self.db.get_value("SELECT COUNT(id) as value FROM passwords", "value")
        pass

    def get_all_passwords(self, filter=None):
        if filter is not None:
            return self.db.query(
                "SELECT * "
                "FROM passwords "
                "WHERE username like '%' || ? || '%' "
                "or site like '%' || ? || '%' "
                "ORDER BY site",
                (filter, filter))
        else:
            return self.db.query("SELECT * FROM passwords ORDER BY site")
