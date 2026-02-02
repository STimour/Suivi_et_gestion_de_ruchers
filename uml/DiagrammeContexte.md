flowchart LR
    %% Person
    Apiculteur["👤 Apiculteur<br/>(Pro / Amateur)"]

    %% System Boundary
    subgraph SYS["📦 Plateforme de gestion apicole"]
        Core["🧠 Système cœur<br/>(Ruchers, Ruches, Interventions,<br/>Production, Généalogie)"]
        GQL["🔌 API GraphQL"]
    end

    %% External Systems
    Mobile["📱 Application Mobile<br/>(Offline-first)"]
    Web["💻 Application Web"]
    IoT["📡 Capteurs IoT<br/>(Poids, Température)"]
    GPS["📍 Traceurs GPS"]
    Map["🗺️ Service cartographique"]
    Notif["🔔 Service de notifications<br/>(Push / Email)"]
    Export["📄 Exports réglementaires<br/>(PDF / CSV)"]

    %% Relations
    Apiculteur --> Mobile
    Apiculteur --> Web

    Mobile -->|Queries / Mutations| GQL
    Web -->|Queries / Mutations| GQL

    GQL --> Core

    IoT -->|Mesures| Core
    GPS -->|Positions| Core

    Core -->|Alertes| Notif
    Core -->|Données géo| Map
    Core -->|Exports| Export
