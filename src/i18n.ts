import { createI18n } from 'vue-i18n'

// Definiamo i messaggi per le lingue supportate
const messages = {
  en: {},
  it: {
    'auth.email': 'Email',
    'auth.passwordAccount': 'Password',
    'auth.masterPassword': 'Master Password',
    'auth.masterPasswordInfo': 'Non viene mai inviata al server',
    'auth.unlock': 'Sblocca',
    'auth.derivingKey': 'Derivazione della chiave in corso...',
    'auth.noAccount': 'Non hai un account?',
    'auth.register': 'Registrati',
    'auth.invalidCredentials': 'Credenziali non valide o Master Password errata',

    'vault.title': 'Il Mio Caveau',
    'vault.noEntries': 'Nessuna voce nel tuo caveau. Crea la tua prima voce!',
    'vault.copy': 'Copia Password',
    'vault.edit': 'Modifica',
    'vault.delete': 'Elimina',
    'vault.locked': 'Caveau bloccato',
    'vault.confirmDelete': 'Sei sicuro di voler eliminare questa voce?',
    'vault.lockOnVisibilityChange': 'Blocca il caveau quando la finestra perde visibilità',
    'vault.addEntry': 'Aggiungi Voce',
    'vault.autoLockIn': 'Blocco automatico in',
    'vault.back': 'Indietro',
    'vault.noSelectedItem': 'Nessuna voce selezionata',

    'item.url': 'URL',
    'item.notes': 'Note',
    'item.remove': 'Rimuovi',
    'item.editEntry': 'Modifica Voce',
    'item.addEntry': 'Aggiungi Voce',
    'item.title': 'Titolo',
    'item.username': 'Nome Utente',
    'item.password': 'Password',
    'item.fieldName': 'Nome Campo',
    'item.addField': 'Aggiungi Campo Personalizzato',
    'item.tags': 'Tag',
    'item.tags.placeholder': 'Premi invio per aggiungere tag',

    'form.cancel': 'Annulla',
    'form.save': 'Salva',
    'form.errorSaving': 'Errore durante il salvataggio',
  },
}

const i18n = createI18n({
  locale: 'it', // Impostiamo l'italiano di default
  fallbackLocale: 'en',
  messages,
})

export default i18n
