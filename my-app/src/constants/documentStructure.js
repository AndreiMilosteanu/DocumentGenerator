export const documentStructure = {
  'Deklarationsanalyse': {
    title: 'Deklarationsanalyse',
    icon: '📄',
    sections: [
      {
        title: 'Projekt Details',
        subsections: ['Standort', 'Auftraggeber']
      },
      {
        title: 'Projekt Objectives',
        subsections: ['Ziele', 'Anforderungen']
      },
      {
        title: 'Anhänge',
        subsections: ['Dokumente', 'Bilder']
      }
    ]
  },
  'Bodenuntersuchung': {
    title: 'Bodenuntersuchung',
    icon: '🔍',
    sections: [
      {
        title: 'Projekt Details',
        subsections: ['Untersuchungsmethoden', 'Probenentnahme']
      },
      {
        title: 'Projekt Objectives',
        subsections: ['Bodenbeschaffenheit', 'Analyseergebnisse']
      },
      {
        title: 'Anhänge',
        subsections: ['Laborberichte', 'Fotos']
      }
    ]
  },
  'Baugrundgutachten': {
    title: 'Baugrundgutachten',
    icon: '📋',
    sections: [
      {
        title: 'Projekt Details',
        subsections: ['Grundstücksdaten', 'Bauvorhaben']
      },
      {
        title: 'Projekt Objectives',
        subsections: ['Bewertung', 'Empfehlungen']
      },
      {
        title: 'Anhänge',
        subsections: ['Gutachten', 'Pläne']
      }
    ]
  },
  'Plattendruckversuch': {
    title: 'Plattendruckversuch',
    icon: '🔨',
    sections: [
      {
        title: 'Projekt Details',
        subsections: ['Versuchsaufbau', 'Durchführung']
      },
      {
        title: 'Projekt Objectives',
        subsections: ['Messergebnisse', 'Auswertung']
      },
      {
        title: 'Anhänge',
        subsections: ['Messprotokolle', 'Diagramme']
      }
    ]
  }
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
export const API_BASE_URL = 'http://localhost:8000' 