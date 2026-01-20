sequenceDiagram

    actor Apiculteur
    participant UI as App Web
    participant GQL as GraphQL API
    participant Resolver as Resolvers
    participant Rules as Moteur de règles
    participant DB as Base de données
    participant Notif as Service Alertes
    autonumber

    Apiculteur ->> UI: Sélection cheptel / rucher
    UI ->> GQL: query Ruches(filtres)
    GQL ->> Resolver: resolveRuches()
    Resolver ->> DB: SELECT ruches
    DB -->> Resolver: Liste ruches
    Resolver -->> GQL: Résultat
    GQL -->> UI: Affichage ruches

    Apiculteur ->> UI: Sélection multi-ruches
    Apiculteur ->> UI: Saisie intervention
    Apiculteur ->> UI: Validation

    UI ->> GQL: mutation createGroupedIntervention(input)
    GQL ->> Resolver: createGroupedIntervention()

    Resolver ->> Rules: validateIntervention(input)
    Rules -->> Resolver: OK / Warnings

    Resolver ->> DB: INSERT Intervention

    loop Pour chaque ruche
        Resolver ->> DB: INSERT RucheIntervention
        Resolver ->> DB: UPDATE statut ruche
    end

    Resolver ->> Rules: evaluatePostIntervention()
    Rules -->> Resolver: Alertes éventuelles

    alt Alertes à créer
        Resolver ->> DB: INSERT Alertes
        Resolver ->> Notif: push/email
    end

    Resolver -->> GQL: Payload résultat
    GQL -->> UI: Success + résumé
    UI -->> Apiculteur: Confirmation