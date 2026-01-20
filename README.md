# Password Manager

Un gestore di password sicuro e moderno sviluppato con Vue 3, TypeScript e Supabase.

## Specifiche del Progetto

Il progetto è stato realizzato utilizzando un moderno stack tecnologico per garantire performance, manutenibilità e sicurezza:

*   **Frontend Framework:** Vue 3 (Composition API)
*   **Build Tool:** Vite
*   **Linguaggio:** TypeScript
*   **State Management:** Pinia
*   **UI/Styling:** Tailwind CSS
*   **Backend & Database:** Supabase (PostgreSQL)
*   **Routing:** Vue Router
*   **Internationalization:** Vue I18n
*   **Icone:** Lucide Vue
*   **Analisi robustezza password:** zxcvbn

## Sfide Tecnologiche e Sicurezza

La sicurezza è stata la priorità principale nello sviluppo di questa applicazione. Per garantire la massima protezione dei dati sensibili degli utenti, sono state affrontate diverse sfide tecniche complesse.

### 1. Crittografia End-to-End (Client-Side Encryption)
Per garantire che nessuno, nemmeno gli amministratori del database o il provider del servizio, possa accedere alle password salvate, è stata implementata una architettura **Zero-Knowledge**.

*   **Problema:** Memorizzare le password in chiaro o cifrate lato server espone i dati a rischi critici in caso di violazione del database (data breach).
*   **Soluzione:** Tutte le password vengono cifrate direttamente nel browser dell'utente (lato client) prima di essere inviate a Supabase. Viene utilizzato l'algoritmo **AES-GCM a 256 bit**, uno standard industriale che garantisce sia la confidenzialità che l'integrità dei dati (autenticazione del messaggio).

### 2. Derivazione Sicura delle Chiavi (PBKDF2)
*   **Problema:** Utilizzare direttamente la password dell'utente come chiave di cifratura è insicuro. Le password umane hanno spesso bassa entropia e sono vulnerabili ad attacchi a dizionario o rainbow table.
*   **Soluzione:** Viene utilizzato l'algoritmo **PBKDF2** (Password-Based Key Derivation Function 2) con **SHA-256** e **100.000 iterazioni**. Questo processo, combinato con un **Salt** univoco, deriva una chiave crittografica robusta dalla Master Password dell'utente, rendendo computazionalmente onerosi e impraticabili gli attacchi di forza bruta.

### 3. Generazione di Numeri Casuali Crittograficamente Sicuri (CSPRNG)
*   **Problema:** Le funzioni pseudo-casuali standard dei linguaggi di programmazione (come `Math.random()`) non sono crittograficamente sicure. Se utilizzate per generare chiavi o IV, possono rendere prevedibile l'intera cifratura.
*   **Soluzione:** L'applicazione utilizza esclusivamente l'API Web Crypto (`window.crypto.getRandomValues()`) per generare:
    *   I **Vettori di Inizializzazione (IV)** a 12 byte per la cifratura AES-GCM, essenziali per garantire che lo stesso testo cifrato due volte produca output diversi.
    *   Le nuove password sicure generate per gli utenti.
    *   I Salt per la derivazione delle chiavi.

### 4. Gestione Sicura dei Dati e della Sessione
*   **Approccio:** L'applicazione è strutturata per separare nettamente la logica di cifratura (`CryptoService`) dall'interfaccia utente. Le chiavi private non vengono mai salvate su disco o inviate via rete, ma risiedono solo nella memoria volatile del dispositivo dell'utente durante la sessione attiva.
*   **Auto-Lock Intelligente:** Per mitigare i rischi legati all'accesso fisico non autorizzato al dispositivo sbloccato:
    *   **Inattività:** Il vault si blocca automaticamente dopo un periodo di inattività configurabile (default 5 minuti), rimuovendo la chiave di decifrazione dalla memoria.
    *   **Cambio Contesto:** È presente un meccanismo di blocco immediato se l'utente cambia scheda o minimizza il browser (configurabile), garantendo che i dati non rimangano esposti se l'utente si allontana momentaneamente.
*   **Protezione Appunti (Clipboard):** Quando una password viene copiata, viene attivato un timer di sicurezza di 30 secondi, al termine del quale la password viene rimossa automaticamente dagli appunti per evitare incollaggi accidentali o accessi da parte di altre applicazioni.

## Setup del Progetto

### Installazione Dipendenze

```sh
npm install
```

### Avvio Server di Sviluppo

```sh
npm run dev
```

### Build per Produzione

```sh
npm run build
```

### Linting e Formattazione

```sh
npm run lint
```
