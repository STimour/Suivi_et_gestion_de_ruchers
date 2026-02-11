flowchart LR
 subgraph SYS["📦 Plateforme de gestion apicole"]
        Core["🧠 Système cœur<br>(Ruchers, Ruches, Interventions,<br>Production, Généalogie)"]
        GQL["🔌 API GraphQL"]
        DJ["⚙️ API Django REST"]
  end
    Apiculteur["👤 Apiculteur<br>(Pro / Amateur)"] --> Web["💻 Application Web"]
    Web -- Queries / Mutations --> GQL
    Web -- REST Calls --> DJ
    GQL --> Core
    DJ --> Core
    Core -- Alertes --> Notif["🔔 Service de notifications<br>(Push / Email)"]
    Core -- Données géo --> Map["🗺️ Service cartographique"]
    Core -- Exports --> Export["📄 Exports réglementaires<br>(PDF / CSV)"]