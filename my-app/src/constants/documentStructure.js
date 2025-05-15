export const API_BASE_URL = 'http://localhost:8000'

// Log the API base URL on application init
console.log('Using API Base URL:', API_BASE_URL)

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const documentStructure = {
  'Deklarationsanalyse': {
    title: 'Deklarationsanalyse',
    icon: '📄',
    sections: [
      {
        key: 'Projekt Details',
        title: 'Projekt Details',
        subsections: [
          { key: 'Standort', title: 'Standort' },
          { key: 'Auftraggeber', title: 'Auftraggeber' }
        ]
      },
      {
        key: 'Projekt Objectives',
        title: 'Projekt Objectives',
        subsections: [
          { key: 'Ziele', title: 'Ziele' },
          { key: 'Anforderungen', title: 'Anforderungen' }
        ]
      },
      {
        key: 'Anhänge',
        title: 'Anhänge',
        subsections: [
          { key: 'Dokumente', title: 'Dokumente' },
          { key: 'Bilder', title: 'Bilder' }
        ]
      }
    ]
  },
  'Bodenuntersuchung': {
    title: 'Bodenuntersuchung',
    icon: '🔍',
    sections: [
      {
        key: 'Projekt Details',
        title: 'Projekt Details',
        subsections: [
          { key: 'Untersuchungsmethoden', title: 'Untersuchungsmethoden' },
          { key: 'Probenentnahme', title: 'Probenentnahme' }
        ]
      },
      {
        key: 'Projekt Objectives',
        title: 'Projekt Objectives',
        subsections: [
          { key: 'Bodenbeschaffenheit', title: 'Bodenbeschaffenheit' },
          { key: 'Analyseergebnisse', title: 'Analyseergebnisse' }
        ]
      },
      {
        key: 'Anhänge',
        title: 'Anhänge',
        subsections: [
          { key: 'Laborberichte', title: 'Laborberichte' },
          { key: 'Fotos', title: 'Fotos' }
        ]
      }
    ]
  },
  'Baugrundgutachten': {
    title: 'Baugrundgutachten',
    icon: '📋',
    sections: [
      {
        key: 'Projekt Details',
        title: 'Projekt Details',
        subsections: [
          { key: 'Grundstücksdaten', title: 'Grundstücksdaten' },
          { key: 'Bauvorhaben', title: 'Bauvorhaben' }
        ]
      },
      {
        key: 'Projekt Objectives',
        title: 'Projekt Objectives',
        subsections: [
          { key: 'Bewertung', title: 'Bewertung' },
          { key: 'Empfehlungen', title: 'Empfehlungen' }
        ]
      },
      {
        key: 'Anhänge',
        title: 'Anhänge',
        subsections: [
          { key: 'Gutachten', title: 'Gutachten' },
          { key: 'Pläne', title: 'Pläne' }
        ]
      }
    ]
  },
  'Plattendruckversuch': {
    title: 'Plattendruckversuch',
    icon: '🔨',
    sections: [
      {
        key: 'Projekt Details',
        title: 'Projekt Details',
        subsections: [
          { key: 'Versuchsaufbau', title: 'Versuchsaufbau' },
          { key: 'Durchführung', title: 'Durchführung' }
        ]
      },
      {
        key: 'Projekt Objectives',
        title: 'Projekt Objectives',
        subsections: [
          { key: 'Messergebnisse', title: 'Messergebnisse' },
          { key: 'Auswertung', title: 'Auswertung' }
        ]
      },
      {
        key: 'Anhänge',
        title: 'Anhänge',
        subsections: [
          { key: 'Messprotokolle', title: 'Messprotokolle' },
          { key: 'Diagramme', title: 'Diagramme' }
        ]
      }
    ]
  }
} 