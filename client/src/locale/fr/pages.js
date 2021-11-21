/* eslint-disable babel/quotes */

export default {
    'page-login': {
        'title': "Connexion",
        'welcome': "Bonjour\u00a0! Qui êtes vous\u00a0?",
        'connexion': "Connexion",
        'please-wait': "Authentification, merci de patienter...",
        'bye': "À bientôt\u00a0!",
        'footer': "Robert2 est un logiciel libre. Vous pouvez le copier et le redistribuer librement, sauf pour une utilisation commerciale.",
        'official-website': "Site web officiel",
        'community-forum': "Forum de la communauté",

        'error': {
            'bad-infos': "Les informations fournies sont incorrectes. Utilisez votre adresse e-mail ou votre pseudo, et votre mot de passe.",
            'expired-session': "Votre session a expiré. Merci de vous reconnecter\u00a0!",
            'not-allowed': "Vous avez essayé d'accéder à une page dont l'accès vous est interdit. Merci de vous connecter avec un compte qui y a accès.",
        },
    },

    'page-profile': {
        'title': "Votre profil",
        'help': "Si vous modifiez votre email, votre pseudo ou votre mot de passe, ne les oubliez pas avant de vous déconnecter\u00a0!",
        'you-are-group': "Vous êtes\u00a0: {group}.",
        'edit-password': "Modifier votre mot de passe",
        'password-confirmation': "Confirmation du mot passe",
        'password-confirmation-must-match': "Le mot de passe et sa confirmation doivent être identiques.",
        'password-modified': "Votre mot de passe a bien été modifié.",
        'saved': "Votre profil a bien été sauvegardé.",
    },

    'page-user-settings': {
        'title': "Vos paramètres",
        'help': "La « durée d'une session » est le temps imparti avant votre déconnexion automatique de l'application.",
        'auth-token-validity-duration': "Durée max. d'une session",
        'interface': "Interface",
        'language': "Langue",
        'hours': "heures",
        'saved': "Paramètres sauvegardés.",
    },

    'page-calendar': {
        'title': "Calendrier",
        'help': (
            `Cliquez-glissez pour déplacer la frise temporelle.
            Utilisez la molette pour zoomer / dézoomer.
            Survolez un événement avec la souris pour en voir les détails.
            Double-cliquez sur une colonne vide pour créer un événement avec la date de départ pré-remplie.`
        ),
        'help-center-view-on-today': "Centrer le calendrier sur aujourd'hui",
        'help-add-event': "Créer un nouvel événement",
        'add-event': "Nouvel événement",
        'confirm-delete': "Mettre cet événement à la corbeille\u00a0?",
        'confirm-permanently-delete': "Voulez-vous vraiment supprimer définitivement cet événement\u00a0?",
        'confirm-restore': "Voulez-vous vraiment restaurer cet événement\u00a0?",
        'event-deleted': "L'événement a bien été supprimé.",
        'event-saved': "L'événement a bien été sauvegardé.",
        'loading-event': "Chargement de l'événement...",
        'help-timeline-event-operations': (
            `Cliquez une fois pour sélectionner l'événement, afin de le déplacer, le redimensionner ou le supprimer.
            Double-cliquez sur l'événement pour en ouvrir l'aperçu, et en modifier les détails.`
        ),
        'center-on-today': "Centrer sur aujourd'hui",
        'center-on': "Centrer sur le",
        'this-event-is-past': "Cet événement est passé.",
        'this-event-is-currently-running': "Cet événement se déroule en ce moment.",
        'this-event-is-confirmed': "Cet événement est confirmé.",
        'this-event-is-not-confirmed': "Cet événement n'est pas encore confirmé\u00a0!",
        'this-event-is-archived': "Cet événement est archivé.",
        'this-event-is-locked': "Cet événement est verrouillé parce qu'il est confirmé ou que son inventaire de retour a été effectué.",
        'this-event-has-missing-materials': "Cet événement a du matériel manquant.",
        'this-event-needs-its-return-inventory': "Il faut faire l'inventaire de retour de cet événement\u00a0!",
        'this-event-has-not-returned-materials': "Cet événement a du matériel qui n'a pas été retourné.",
        'all-events': "Tous les événements",
        'event-with-missing-material-only': "Événements en manque de matériel uniquement\u00a0?",
        'display-all-parks': "Tous les parcs",
        'caption': {
            'title': "Légende\u00a0:",
            'archived': "Archivé",
            'past-and-ok': "Passé, inventaire fait et OK",
            'past-material-not-returned': "Matériel non retourné\u00a0!",
            'past-no-inventory': "Passé sans inventaire",
            'past-not-confirmed': "Passé et non confirmé",
            'current-confirmed': "Actuel et confirmé",
            'current-not-confirmed': "Actuel non confirmé",
            'future-confirmed': "Futur et confirmé",
            'future-not-confirmed': "Futur non confirmé",
        },
    },

    'page-events': {
        'help-edit': "",
        'back-to-calendar': "Retour au calendrier",
        'add': "Nouvel événement",
        'edit': "Modifier l'événement «\u00a0{pageSubTitle}\u00a0»",
        'edit-event': "Modifier l'événement",
        'save-and-back-to-calendar': "Sauvegarder et retour au calendrier",
        'save-and-continue': "Sauvegarder et continuer",
        'continue': "Continuer",
        'step': "Étape",
        'event-informations': "Informations",
        'event-beneficiaries': "Bénéficiaires",
        'event-technicians': "Techniciens",
        'event-materials': "Matériel",
        'event-summary': "Récapitulatif",
        'event-confirmation': "Confirmation",
        'no-technician-pass-this-step': (
            `Il n'y a aucun technicien disponible pour cette période.
            Vous pouvez passer cette étape.`
        ),
        'technician-item': {
            'confirm-permanently-delete': "Voulez-vous vraiment supprimer l'assignation de ce technicien ?",
        },
        'assign-technician': "Assigner {name} en tant que technicien(ne)",
        'assign-name': "Assigner {name}",
        'modify-assignment': "Modifier l'assignation",
        'remove-assignment': "Supprimer l'assignation",
        'period-assigned': "Période assignée",
        'start-end-dates-and-time': "Dates et heures de début et fin",
        'saved': "Événement sauvegardé.",
        'not-saved': "L'événement comporte des modifications non sauvegardées",
        'event-not-confirmed-help': "L'événement n'est pas encore confirmé, il est susceptible de changer à tout moment.",
        'event-confirmed-help': "L'événement est confirmé\u00a0: Ses informations ne devraient plus changer.",
        'event-missing-materials': "Matériel manquant",
        'event-missing-materials-help': "Il s'agit du matériel manquant pour la période de l'événement, car il est utilisé dans un autre événement, le nombre voulu est trop important, ou quelques uns sont en panne. Ce matériel doit donc être ajouté au parc, ou bien loué auprès d'une autre société.",
        'warning-no-material': "Attention, cet événement est vide, il ne contient aucun matériel pour le moment\u00a0!",
        'warning-no-beneficiary': "Attention, cet événement n'a aucun bénéficiaire\u00a0!",
        'beneficiary-billing-help': "Seul le premier bénéficiaire de la liste apparaîtra sur la facture.",
        'technicians-help': "Double-cliquez sur la ligne d'un technicien à la date/heure de début voulue pour l'assigner à l'événement.",
        'missing-material-count': "Besoin de {quantity}, il en manque\u00a0{missing}\u00a0!",
        'problems-on-returned-materials': "Problèmes sur le matériel retourné",
        'return-inventory-not-done-yet': "L'inventaire du retour de matériel n'a pas été fait, ou n'est pas encore terminé.",
        'do-or-terminate-return-inventory': "Faire ou terminer l'inventaire de retour du matériel",
        'view-return-inventory': "Voir l'inventaire de retour en détail",
        'not-returned-material-count': [
            "{returned} retourné sur {out}\u00a0! Il en manque {missing}.",
            "{returned} retournés sur {out}\u00a0! Il en manque {missing}.",
        ],
        'broken-material-count': [
            "{broken} revenu en panne\u00a0!",
            "{broken} revenus en panne\u00a0!",
        ],
    },

    'page-event-return': {
        'title': "Retour du matériel de l'événement «\u00a0{pageSubTitle}\u00a0»",
        'help': "",
        'this-event-is-not-past': "Cet événement n'est pas terminé, il n'est donc pas possible de vérifier son retour pour le moment.",
        'confirm-terminate-title': "Voulez-vous vraiment terminer cet inventaire de retour\u00a0?",
        'confirm-terminate-text': "Veuillez noter qu'il ne sera plus possible de le modifier.",
        'confirm-terminate-text-with-broken': "Ceci aura pour effet de mettre à jour toutes les quantités «\u00a0en panne\u00a0» du matériel concerné, et il ne sera plus possible de modifier cet inventaire.",
        'inventory-done': "Inventaire terminé",
        'some-material-is-missing': "Du matériel n'est pas revenu de cet événement\u00a0!",
        'all-material-returned': "Félicitations\u00a0! Tout le matériel a bien été retourné pour cet événement.",
        'some-material-came-back-broken': "Du matériel est revenu en panne.",
    },

    'page-users': {
        'title': "Utilisateurs",
        'help': "Vous pouvez envoyer un email à un utilisateur en cliquant sur son adresse.",
        'help-edit': (
            `- Le groupe «\u00a0Administrateur\u00a0» donne tous les droits à l'utilisateur.
            - Le groupe «\u00a0Membre\u00a0» permet à l'utilisateur d'utiliser la plupart des fonctions de Robert.
            - Le groupe «\u00a0Visiteur\u00a0» donne un accès limité à certaines données.`
        ),
        'action-add': "Nouvel utilisateur",
        'add': "Nouvel utilisateur",
        'edit': "Modifier l'utilisateur «\u00a0{pageSubTitle}\u00a0»",
        'edit-title': "Modifier l'utilisateur",
        'confirm-delete': "Mettre cet utilisateur à la corbeille\u00a0?",
        'confirm-permanently-delete': "Voulez-vous vraiment supprimer définitivement cet utilisateur\u00a0?",
        'confirm-restore': "Voulez-vous vraiment restaurer cet utilisateur\u00a0?",
        'saved': "Utilisateur sauvegardé.",
        'profile-missing-or-deleted': "Profil manquant ou supprimé",
    },

    'page-beneficiaries': {
        'title': "Bénéficiaires",
        'help': "Vous pouvez envoyer un email à un bénéficiaire en cliquant sur son adresse.",
        'action-add': "Nouveau bénéficiaire",
        'add': "Nouveau bénéficiaire",
        'edit': "Modifier le bénéficiaire «\u00a0{pageSubTitle}\u00a0»",
        'edit-title': "Modifier le bénéficiaire",
        'beneficiary-type': "Type de bénéficiaire",
        'person': "Personne physique (individu)",
        'company': "Personne morale (entreprise)",
        'help-edit': (
            `Seuls le nom et le prénom de la personne sont obligatoires.
            La «\u00a0référence\u00a0» est un numéro client ou adhérent pour votre gestion interne, qui apparaîtra sur les fiches de sorties, les devis et les factures. Il doit être unique.`
        ),
        'confirm-delete': "Mettre ce bénéficiaire à la corbeille\u00a0?",
        'confirm-permanently-delete': "Voulez-vous vraiment supprimer définitivement ce bénéficiaire\u00a0?",
        'confirm-restore': "Voulez-vous vraiment restaurer ce bénéficiaire\u00a0?",
        'saved': "Bénéficiaire sauvegardé.",
    },

    'page-companies': {
        'title': "Sociétés",
        'add': "Nouvelle société",
        'edit': "Modifier la société «\u00a0{pageSubTitle}\u00a0»",
        'edit-title': "Modifier la société",
        'edit-btn': "Modifier la société",
        'create-new': "Ajouter une nouvelle société",
        'help-edit': "La raison sociale (nom de la société) est obligatoire.",
        'attached-persons': "Personnes associées à la société",
        'saved': "Société sauvegardée.",
    },

    'page-materials': {
        'title': "Matériel",
        'help': "Vous pouvez choisir un parc, une catégorie ou des étiquettes pour filtrer le matériel.",
        'action-add': "Nouveau matériel",
        'manage-attributes': "Gérer les caractéristiques spéciales",
        'display-quantities-at-date': "Afficher les quantités à date...",
        'remaining-quantities-on-date': (
            `Quantités restantes
            le {date}`
        ),
        'remaining-quantities-on-period': (
            `Quantités restantes
            du\u00a0{from} au\u00a0{to}`
        ),
        'add': "Nouveau matériel",
        'edit': "Modifier le matériel «\u00a0{pageSubTitle}\u00a0»",
        'help-edit': (
            `Trouvez un nom assez court, et utilisez plutôt la description pour détailler le matériel si besoin.

            La photo du matériel doit être au format JPG, PNG ou WEBP, et ne doit pas dépasser 10\u00a0Mo.`
        ),
        'confirm-delete': "Mettre ce matériel à la corbeille\u00a0?",
        'confirm-permanently-delete': "Voulez-vous vraiment supprimer définitivement ce matériel\u00a0?",
        'confirm-restore': "Voulez-vous vraiment restaurer ce matériel\u00a0?",
        'saved': "Matériel sauvegardé.",
        'print-complete-list': "Imprimer la liste complète du matériel",
        'more-attribute-when-category-selected': "Après avoir sélectionné une catégorie, d'autres caractéristiques spéciales peuvent apparaître.",
    },

    'page-materials-view': {
        'title': "Détails du matériel «\u00a0{pageSubTitle}\u00a0»",
        'infos': {
            'click-to-open-image': "Cliquez pour ouvrir l'image en grand dans un nouvel onglet.",
        },
        'documents': {
            'no-document': "Aucun document pour le moment.",
            'drag-and-drop-files-here': "Glissez-déposez des fichiers ici ↓ pour les ajouter.",
            'choose-files': "Ou cliquez ici pour choisir des fichiers à ajouter",
            'send-files': [
                "Envoyer le fichier",
                "Envoyer {count} fichiers",
            ],
            'click-to-open': "Cliquez pour ouvrir / télécharger le fichier",
            'confirm-permanently-delete': "Voulez-vous vraiment supprimer définitivement ce document\u00a0?",
            'saved': "Documents sauvegardés.",
            'deleted': "Document supprimé.",
        },
    },

    'page-attributes': {
        'title': "Caractéristiques spéciales du matériel",
        'help': (
            `Ici vous pouvez ajouter les champs qui permettent de décrire votre matériel selon vos propres critères.
            Une fois créée, une caractéristique spéciale ne pourra plus être modifiée (sauf son nom).`
        ),
        'go-back-to-material': "Retourner au matériel",
        'name': "Nom de la caractéristique",
        'type': "Type de donnée",
        'unit': "Unité",
        'max-length': "Taille max.",
        'type-string': "Texte",
        'type-integer': "Nombre entier",
        'type-float': "Nombre décimal",
        'type-boolean': "Booléen (Oui / Non)",
        'type-date': "Date",
        'no-limit': "Sans limite",
        'add-attributes': "Ajouter des caractéristiques",
        'no-attribute-yet': "Aucune caractéristique spéciale pour le moment.",
        'add-btn': "Ajouter une caractéristique",
        'limited-to-categories': "Limitée aux catégories",
        'confirm-permanently-delete': (
            `Voulez-vous vraiment supprimer définitivement cette caractéristique spéciale\u00a0?

            ATTENTION\u00a0: Toutes les données relative à cette caractéristique spéciale seront supprimées DÉFINITIVEMENT\u00a0!!`
        ),
        'second-confirm': {
            'confirm-permanently-delete': (
                `Désolé d'insister, mais cette opération IRRÉVERSIBLE.

        Voulez-vous VRAIMENT supprimer cette caractéristique spéciale\u00a0?`
            ),
        },
    },

    'page-categories': {
        'title': "Catégories",
        'help': "Gestion des catégories et sous-catégories de matériel.",
        'action-add': "Nouvelle catégorie",
        'prompt-add': "Nouvelle catégorie",
        'category-name': "Nom de la catégorie",
        'create': "Créer la catégorie",
        'prompt-modify': "Modifier la catégorie",
        'confirm-delete': "Mettre cette catégorie à la corbeille\u00a0?",
        'confirm-permanently-delete': "Voulez-vous vraiment supprimer définitivement cette catégorie\u00a0?",
        'confirm-restore': "Voulez-vous vraiment restaurer cette catégorie\u00a0?",
        'saved': "Catégorie sauvegardée.",
        'deleted': "Catégorie supprimée.",
        'display-materials': "Voir le matériel de la catégorie",
        'no-category': "Aucune catégorie.",
        'create-a-category': "Créer une catégorie",
        'cannot-delete-not-empty': "Impossible de supprimer cette catégorie, car elle n'est pas vide\u00a0!",
    },

    'page-subcategories': {
        'add': "Ajouter une sous-catégorie",
        'prompt-add': "Nouvelle sous-catégorie de «\u00a0{categoryName}\u00a0»",
        'sub-category-name': "Nom de la sous-catégorie",
        'create': "Créer la sous-catégorie",
        'prompt-modify': "Modifier la sous-catégorie",
        'confirm-delete': "Mettre cette sous-catégorie à la corbeille\u00a0?",
        'confirm-permanently-delete': "Voulez-vous vraiment supprimer définitivement cette sous-catégorie\u00a0?",
        'confirm-restore': "Voulez-vous vraiment restaurer cette sous-catégorie\u00a0?",
        'saved': "Sous-catégorie sauvegardée.",
        'deleted': "Sous-catégorie supprimée.",
        'display-materials': "Voir le matériel de la sous-catégorie",
    },

    'page-technicians': {
        'title': "Techniciens",
        'help': "Vous pouvez envoyer un email à un technicien en cliquant sur son adresse.",
        'action-add': "Nouveau technicien",
        'add': "Nouveau technicien",
        'edit': "Modifier le technicien «\u00a0{pageSubTitle}\u00a0»",
        'edit-title': "Modifier le technicien",
        'help-edit': "Seuls le nom et le prénom de la personne sont obligatoires.",
        'confirm-delete': "Mettre ce technicien à la corbeille\u00a0?",
        'confirm-permanently-delete': "Voulez-vous vraiment supprimer définitivement ce technicien\u00a0?",
        'confirm-restore': "Voulez-vous vraiment restaurer ce technicien\u00a0?",
        'saved': "Technicien sauvegardé.",
        'period-of-availability': "Période de disponibilité",
    },

    'page-technician-view': {
        'title': "Technicien «\u00a0{name}\u00a0»",
        'modify-associated-user': "Modifier l'utilisateur associé",
    },

    'page-parks': {
        'title': "Parcs de matériel",
        'help': "Vous pouvez cliquer sur le nombre d'articles que contient le parc pour en afficher la liste.",
        'action-add': "Nouveau parc de matériel",
        'add': "Nouveau parc de matériel",
        'edit': "Modifier le parc «\u00a0{pageSubTitle}\u00a0»",
        'edit-title': "Modifier le parc",
        'help-edit': "Seul le nom du parc est obligatoire.",
        'confirm-delete': "Mettre ce parc à la corbeille\u00a0? Cela ne supprimera pas le matériel qu'il contient.",
        'confirm-permanently-delete': "Voulez-vous vraiment supprimer définitivement ce parc\u00a0? ATTENTION, cela supprimera tout le matériel contenu dans ce parc\u00a0!!",
        'confirm-restore': "Voulez-vous vraiment restaurer ce parc\u00a0?",
        'saved': "Parc sauvegardé.",
        'total-items': 'Totaux',
        'display-events-for-park': "Voir les événements",
        'display-materials-of-this-park': "Voir le matériel de ce parc",
        'print-materials-of-this-park': "Imprimer la liste de ce parc",
    },

    'page-tags': {
        'title': "Étiquettes",
        'help': "Les étiquettes non modifiables sont celles utilisées par le système.",
        'no-item': "Aucune étiquette.",
        'no-item-in-trash': "Aucune étiquette dans la corbeille.",
        'action-add': "Nouvelle étiquette",
        'prompt-add': "Nouvelle étiquette",
        'tag-name': "Nom de l'étiquette",
        'create': "Créer l'étiquette",
        'add': "Nouvelle étiquette",
        'prompt-modify': "Modifier l'étiquette",
        'confirm-delete': "Mettre cette étiquette à la corbeille\u00a0?",
        'confirm-permanently-delete': "Voulez-vous vraiment supprimer définitivement cette étiquette\u00a0?",
        'confirm-restore': "Voulez-vous vraiment restaurer cette étiquette\u00a0?",
        'saved': "Étiquette sauvegardée.",
        'deleted': "Étiquette supprimée.",
    },

    'page-settings': {
        'title': "Paramètres de l'application",
        'event-summary': {
            'title': "Fiches de sortie",
            'help': "Ici, vous pouvez personnaliser les fiches de sortie des événements.",
            'material-list': "Liste du matériel",
            'display-mode': "Mode de présentation",
            'list-display-mode-categories': "Triée par catégories",
            'list-display-mode-sub-categories': "Triée par sous-catégories",
            'list-display-mode-parks': "Triée par parcs",
            'list-display-mode-flat': "Liste non-triée",
            'custom-text': "Texte personnalisé (bas de page)",
            'custom-text-title': "Titre du texte",
            'custom-text-content': "Contenu du texte",
            'saved': "Les paramètres des fiches de sortie ont bien été sauvegardés.",
        },
    },

    'page-estimate': {
        'confirm-delete': "Voulez-vous vraiment supprimer ce devis\u00a0?",
    },
};
