export const API_BASE_URL =
  import.meta.env.DEV
    ? 'http://localhost:8000'
    : '/api'

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
        key: 'Stellungnahme',
        title: 'Stellungnahme',
        subsections: [
          { key: 'Probenahmeprotokoll', title: 'Probenahmeprotokoll' },
          { key: 'Laborberichte', title: 'Laborberichte' },
          { key: 'Auswertung', title: 'Auswertung' }
        ]
      },
      {
        key: 'Anhänge',
        title: 'Anhänge',
        subsections: [
          { key: 'Dateien', title: 'Dateien' }
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
        key: 'Allgemeines und Bauvorhaben',
        title: 'Allgemeines und Bauvorhaben',
        subsections: [
          { key: 'Anlass und Vorgaben', title: 'Anlass und Vorgaben' },
          { key: 'Geländeverhältnisse und Bauwerk', title: 'Geländeverhältnisse und Bauwerk' },
          { key: 'Geotechnische Kategorie', title: 'Geotechnische Kategorie' },
          { key: 'Geologie', title: 'Geologie' },
          { key: 'Standortbezogene Gefährdungszonen', title: 'Standortbezogene Gefährdungszonen' }
        ]
      },
      {
        key: 'Feldarbeiten',
        title: 'Feldarbeiten',
        subsections: [
          { key: 'Geotechnische Untersuchungen', title: 'Geotechnische Untersuchungen' },
          { key: 'Untergrundverhältnisse', title: 'Untergrundverhältnisse' },
          { key: 'Grundwasserverhältnisse', title: 'Grundwasserverhältnisse' },
          { key: 'Wasserdurchlässigkeit der Böden', title: 'Wasserdurchlässigkeit der Böden' }
        ]
      },
      {
        key: 'Bodenkennwerte und Klassifikation',
        title: 'Bodenkennwerte und Klassifikation',
        subsections: [
          { key: 'Geotechnische Kennwerte', title: 'Geotechnische Kennwerte' },
          { key: 'Bodenklassifikation und Homogenbereiche', title: 'Bodenklassifikation und Homogenbereiche' }
        ]
      },
      {
        key: 'Gründungsempfehlung',
        title: 'Gründungsempfehlung',
        subsections: [
          { key: 'Baugrundbeurteilung', title: 'Baugrundbeurteilung' },
          { key: 'Einzel- und Streifenfundamente', title: 'Einzel- und Streifenfundamente' },
          { key: 'Fundamentplatte', title: 'Fundamentplatte' },
          { key: 'Allgemeine Vorgaben für alle Gründungsvarianten', title: 'Allgemeine Vorgaben für alle Gründungsvarianten' },
          { key: 'Angaben zur Bemessung der Gründung', title: 'Angaben zur Bemessung der Gründung' }
        ]
      },
      {
        key: 'Wasserbeanspruchung und Abdichtung',
        title: 'Wasserbeanspruchung und Abdichtung',
        subsections: [
          { key: 'Wasserbeanspruchung und Abdichtung', title: 'Wasserbeanspruchung und Abdichtung' }
        ]
      },
      {
        key: 'Bauausführung',
        title: 'Bauausführung',
        subsections: [
          { key: 'Herstellen der Baugrube', title: 'Herstellen der Baugrube' },
          { key: 'Wiedereinbau von anfallendem Bodenaushub', title: 'Wiedereinbau von anfallendem Bodenaushub' },
          { key: 'Entsorgung von Bodenaushub', title: 'Entsorgung von Bodenaushub' },
          { key: 'Hinweise', title: 'Hinweise' }
        ]
      },
      {
        key: 'Schlussbemerkung',
        title: 'Schlussbemerkung',
        subsections: [
          { key: 'Schlussbemerkung', title: 'Schlussbemerkung' }
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