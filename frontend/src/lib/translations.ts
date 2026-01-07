export type Language = 'en' | 'es';

export const translations = {
    en: {
        common: {
            search: "Search conversations...",
            loading: "Loading...",
            settings: "Settings",
            save: "Save",
            cancel: "Cancel",
            error: "Error",
            success: "Success",
        },
        inbox: {
            title: "Inbox",
            all: "All",
            unread: "Unread",
            ai: "AI",
            noMessages: "No messages yet",
            typeMessage: "Type a message or use / for AI templates...",
            aiAssist: "AI Assist",
            suggestedReplies: "Suggested Replies",
            regenerate: "Regenerate",
            thinking: "Thinking...",
            loading: "Loading conversations...",
            helpTip: "If they don't appear, make sure you've sent a test message.",
            startChat: "No messages yet. Start the conversation!",
            aicopilot: "AI Copilot",
            online: "online",
            offline: "offline",
        },
        settings: {
            title: "Settings",
            language: "Language",
            languageDesc: "Choose your preferred interface language.",
            waSettings: "WhatsApp Settings",
            waSettingsDesc: "Manage your WhatsApp Cloud API credentials.",
            saveSettings: "Save Configuration",
            tabs: {
                general: "General",
                whatsapp: "WhatsApp Config",
                ai: "AI Configuration",
                debug: "Debug Tools"
            }
        },
        navigation: {
            dashboard: "Dashboard",
            inbox: "Unified Inbox",
            kanban: "Kanban Board",
            contacts: "Contacts",
            tasks: "Tasks",
            insights: "Insights",
            automations: "Automations",
            waDebug: "WhatsApp Debug",
            waSettings: "WhatsApp Settings",
        },
        insights: {
            title: "Flow Insights",
            subtitle: "Real-time operational metrics for your WhatsApp sales pipeline.",
            export: "Export Report",
            newReport: "New Report",
            aiAnalysis: {
                title: "AI Revenue Analysis",
                momentum: "High Momentum",
                description: "Based on current negotiation stages, you are on track to exceed Q4 targets by {percent}.",
                viewFull: "View Full Analysis"
            },
            kpis: {
                contacts: "Total Contacts",
                deals: "Active Deals",
                pipeline: "Pipeline Value",
                automation: "AI Automation"
            },
            charts: {
                revenue: "Revenue Growth",
                revenueSub: "Projected vs Actual Revenue this week",
                legend: "Revenue"
            }
        },
        dashboard: {
            greeting: "Good Morning, {name}",
            activeChats: "Active Chats",
            aiReplyTime: "Avg. AI Reply Time",
            pipelineOverview: "Pipeline Overview",
            totalActiveDeals: "Total Active Deals",
            priorityAttention: "Priority Attention",
            viewKanban: "View Kanban",
            addDeal: "Add Deal",
            operationalFlow: "Here is your operational flow for today.",
            noReplyToProposal: "No reply to proposal",
            followUp: "Follow Up",
            aiDraft: "AI Draft",
            reply: "Reply",
            viewAllActivity: "View All Activity",
            stalled: "Stalled",
            highIntent: "High Intent",
            dueToday: "Due today"
        },
        aiDrawer: {
            title: "Flow Assistant",
            subtitle: "AI Active • Analyzing",
            summaryTitle: "AI Summary",
            refresh: "Refresh",
            engagementRisk: "Engagement Risk",
            engagementRiskDesc: "Last response from {name} was {time}. Keep the momentum!",
            nextBestAction: "Next Best Action",
            autoPilot: "Autopilot",
            actionDesc: "{name} is waiting. Review the latest request.",
            analyzeButton: "Analyze Context",
            intentTitle: "Intelligent Extraction",
            intentLabel: "Intent",
            intentValue: "Detecting...",
            extractedData: {
                title: "Extracted Data",
                email: "Email",
                budget: "Budget",
                location: "Location",
                meeting: "Meeting"
            },
            generating: "Analyzing conversation...",
            noData: "No summary available. Start chatting to generate insights.",
            selectConversation: "Select a conversation to view AI insights",
        },
        handover: {
            alerts: "Intervention Alerts",
            jump: "Ver Chat",
            approvePayment: "Approve Payment",
            resolve: "Mark Resolve",
            noAlerts: "No pending alerts",
            aiManaged: "AI Managed",
            aiDisabled: "AI Handed over to Human",
            autoPilot: "Autonomous AI Mode",
            autoPilotDesc: "Enable AI to automatically reply to messages.",
        },
        contacts: {
            title: "Contacts",
            subtitle: "Manage and view all your customer relationships.",
            searchPlaceholder: "Search contacts...",
            addContact: "Add Contact",
            table: {
                contact: "Contact",
                status: "Status",
                tags: "Tags",
                actions: "Actions"
            },
            noContacts: "No contacts found",
            trySearch: "Try a different search term.",
            selectContact: "Select a contact to view profile",
            viewAll: "View All Contacts"
        },
        profile: {
            tabs: {
                overview: "Overview",
                notes: "Notes",
                tasks: "Tasks",
                files: "Files"
            },
            details: "Details",
            contactInfo: "Contact Info",
            tags: "Tags",
            aiInsight: "Pitaya AI Insight",
            verified: "Verified Contact",
            active: "Active",
            newDeal: "New Deal",
            comingSoon: "{tab} feature coming soon",
            noActivity: "No recent activity",
            yourMessage: "Your Message",
            waInteraction: "WhatsApp Interaction",
            notes: {
                placeholder: "Type a new note...",
                save: "Save Note",
                saving: "Saving...",
                noNotes: "No notes yet",
                by: "by"
            },
            edit: {
                title: "Edit Contact",
                name: "Full Name",
                email: "Email Address",
                phone: "Phone Number",
                save: "Save Changes",
                saving: "Saving..."
            }
        },
        tasks: {
            title: "Tasks & Follow-ups",
            subtitle: "Manage your daily operations, SLAs, and conversation follow-ups.",
            createTask: "Create Task",
            totalTasks: "Total Tasks",
            completedTasks: "Completed Tasks",
            highPriority: "High Priority",
            breachTasks: "Breach Tasks",
            table: {
                description: "Task Description",
                contact: "Contact",
                dueDate: "Due Date",
                priority: "Priority",
                assignee: "Assignee"
            },
            modal: {
                title: "Create New Task",
                subtitle: "Add a task to your flow board.",
                taskTitle: "Task Title",
                titlePlaceholder: "e.g. Follow up on proposal",
                linkContext: "Link to Context",
                searchPlaceholder: "Search WhatsApp contact...",
                linkedTo: "Linked to",
                none: "None",
                priorityLevel: "Priority Level",
                assigneeLabel: "Assignee",
                you: "You"
            }
        },
        automations: {
            title: "Automations",
            subtitle: "Create and manage your intelligent workflows.",
            createAutomation: "Create Automation",
            active: "Active",
            inactive: "Inactive",
            lastRun: "Last run: {time}",
            triggers: "Triggers",
            actions: "Actions",
            noAutomations: "No automations found",
            comingSoon: "Visual Automation Builder coming soon."
        }
    },
    es: {
        common: {
            search: "Buscar conversaciones...",
            loading: "Cargando...",
            settings: "Configuración",
            save: "Guardar",
            cancel: "Cancelar",
            error: "Error",
            success: "Éxito",
        },
        inbox: {
            title: "Bandeja de entrada",
            all: "Todos",
            unread: "No leídos",
            ai: "IA",
            noMessages: "Sin mensajes aún",
            typeMessage: "Escribe un mensaje o usa / para plantillas de IA...",
            aiAssist: "Asistente IA",
            suggestedReplies: "Respuestas sugeridas",
            regenerate: "Regenerar",
            thinking: "Pensando...",
            loading: "Cargando conversaciones...",
            helpTip: "Si no aparecen, asegúrate de haber enviado un mensaje de prueba.",
            startChat: "No hay mensajes aún. ¡Empieza la conversación!",
            aicopilot: "Copiloto IA",
            online: "en línea",
            offline: "desconectado",
        },
        settings: {
            title: "Configuración",
            language: "Idioma",
            languageDesc: "Elige tu idioma de interfaz preferido.",
            waSettings: "Configuración de WhatsApp",
            waSettingsDesc: "Gestiona tus credenciales de WhatsApp Cloud API.",
            saveSettings: "Guardar Configuración",
            tabs: {
                general: "General",
                whatsapp: "Configuración WhatsApp",
                ai: "Configuración IA",
                debug: "Herramientas de Depuración"
            }
        },
        navigation: {
            dashboard: "Panel de control",
            inbox: "Bandeja Unificada",
            kanban: "Tablero Kanban",
            contacts: "Contactos",
            tasks: "Tareas",
            insights: "Estadísticas",
            automations: "Automatizaciones",
            waDebug: "Depurador WhatsApp",
            waSettings: "Ajustes WhatsApp",
        },
        dashboard: {
            greeting: "Buenos días, {name}",
            activeChats: "Chats Activos",
            aiReplyTime: "Tiempo de Respuesta IA (Promedio)",
            pipelineOverview: "Resumen de Pipeline",
            totalActiveDeals: "Total de Negocios Activos",
            priorityAttention: "Atención Prioritaria",
            viewKanban: "Ver Kanban",
            addDeal: "Nuevo Negocio",
            operationalFlow: "Este es tu flujo operativo para hoy.",
            noReplyToProposal: "Sin respuesta a la propuesta",
            followUp: "Seguimiento",
            aiDraft: "Borrador IA",
            reply: "Responder",
            viewAllActivity: "Ver Toda la Actividad",
            stalled: "Estancado",
            highIntent: "Intención Alta",
            dueToday: "Vence hoy"
        },
        aiDrawer: {
            title: "Asistente Flow",
            subtitle: "IA Activa • Analizando",
            summaryTitle: "Resumen IA",
            refresh: "Actualizar",
            engagementRisk: "Riesgo de Abandono",
            engagementRiskDesc: "Última respuesta de {name}: {time}. ¡Mantén el ritmo!",
            nextBestAction: "Mejor Siguiente Acción",
            autoPilot: "Piloto Automático",
            actionDesc: "{name} está esperando. Revisa la última solicitud.",
            analyzeButton: "Analizar Contexto",
            intentTitle: "Extracción Inteligente",
            intentLabel: "Intención",
            intentValue: "Detectando...",
            extractedData: {
                title: "Datos Extraídos",
                email: "Email",
                budget: "Presupuesto",
                location: "Ubicación",
                meeting: "Reunión"
            },
            generating: "Analizando conversación...",
            noData: "Resumen no disponible. Comienza a chatear para generar insights.",
            selectConversation: "Selecciona una conversación para ver insights de IA",
        },
        handover: {
            alerts: "Alertas de Intervención",
            jump: "Ver Chat",
            approvePayment: "Aprobar Pago",
            resolve: "Resolver",
            noAlerts: "Sin alertas pendientes",
            aiManaged: "Gestionado por IA",
            aiDisabled: "IA cedió el control a Humano",
            autoPilot: "Modo IA Autónomo",
            autoPilotDesc: "Permite que la IA responda mensajes automáticamente.",
        },
        contacts: {
            title: "Contactos",
            subtitle: "Gestiona y visualiza todas tus relaciones con clientes.",
            searchPlaceholder: "Buscar contactos...",
            addContact: "Nuevo Contacto",
            table: {
                contact: "Contacto",
                status: "Estado",
                tags: "Etiquetas",
                actions: "Acciones"
            },
            noContacts: "No se encontraron contactos",
            trySearch: "Intenta con un término de búsqueda diferente.",
            selectContact: "Selecciona un contacto para ver su perfil",
            viewAll: "Ver todos los contactos"
        },
        profile: {
            tabs: {
                overview: "Resumen",
                notes: "Notas",
                tasks: "Tareas",
                files: "Archivos"
            },
            details: "Detalles",
            contactInfo: "Información de contacto",
            tags: "Etiquetas",
            aiInsight: "Insight de Pitaya IA",
            verified: "Contacto Verificado",
            active: "Activo",
            newDeal: "Nuevo Negocio",
            comingSoon: "La función de {tab} estará disponible pronto",
            noActivity: "Sin actividad reciente",
            yourMessage: "Tu Mensaje",
            waInteraction: "Interacción de WhatsApp",
            notes: {
                placeholder: "Escribe una nueva nota...",
                save: "Guardar Nota",
                saving: "Guardando...",
                noNotes: "Aún no hay notas",
                by: "por"
            },
            edit: {
                title: "Editar Contacto",
                name: "Nombre Completo",
                email: "Correo Electrónico",
                phone: "Número de Teléfono",
                save: "Guardar Cambios",
                saving: "Guardando..."
            }
        },
        tasks: {
            title: "Tareas y Seguimientos",
            subtitle: "Gestiona tus operaciones diarias, SLAs y seguimientos de conversaciones.",
            createTask: "Crear Tarea",
            totalTasks: "Tareas Totales",
            completedTasks: "Tareas Completadas",
            highPriority: "Prioridad Alta",
            breachTasks: "Tareas en Incumplimiento",
            table: {
                description: "Descripción de la Tarea",
                contact: "Contacto",
                dueDate: "Fecha de Vencimiento",
                priority: "Prioridad",
                assignee: "Asignado"
            },
            modal: {
                title: "Crear Nueva Tarea",
                subtitle: "Añade una tarea a tu tablero de flujo.",
                taskTitle: "Título de la Tarea",
                titlePlaceholder: "Ej: Seguimiento de propuesta",
                linkContext: "Vincular al Contexto",
                searchPlaceholder: "Buscar contacto de WhatsApp...",
                linkedTo: "Vinculado a",
                none: "Ninguno",
                priorityLevel: "Nivel de Prioridad",
                assigneeLabel: "Responsable",
                you: "Tú"
            }
        },
        automations: {
            title: "Automatizaciones",
            subtitle: "Crea y gestiona tus flujos de trabajo inteligentes.",
            createAutomation: "Nueva Automatización",
            active: "Activa",
            inactive: "Inactiva",
            lastRun: "Última ejecución: {time}",
            triggers: "Disparadores",
            actions: "Acciones",
            noAutomations: "No se encontraron automatizaciones",
            comingSoon: "Constructor Visual de Automatizaciones próximamente."
        },
        insights: {
            title: "Insights de Flujo",
            subtitle: "Métricas operativas en tiempo real para tu canal de ventas de WhatsApp.",
            export: "Exportar Reporte",
            newReport: "Nuevo Reporte",
            aiAnalysis: {
                title: "Análisis de Ingresos por IA",
                momentum: "Alto Momento",
                description: "Según las etapas actuales de negociación, estás en camino de superar los objetivos del cuarto trimestre en un {percent}.",
                viewFull: "Ver Análisis Completo"
            },
            kpis: {
                contacts: "Contactos Totales",
                deals: "Tratos Activos",
                pipeline: "Valor del Pipeline",
                automation: "Automatización IA"
            },
            charts: {
                revenue: "Crecimiento de Ingresos",
                revenueSub: "Ingresos Proyectados vs Reales esta semana",
                legend: "Ingresos"
            }
        }
    }
};
