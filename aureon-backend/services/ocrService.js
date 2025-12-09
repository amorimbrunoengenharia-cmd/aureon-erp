/**
 * OCR SERVICE
 * Optical Character Recognition for prescription attachments
 * Using Tesseract.js (local, offline OCR)
 */

import Tesseract from 'tesseract.js';
import logger from '../utils/logger.js';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

class OCRService {
  constructor() {
    this.provider = 'tesseract';
    this.supportedFormats = ['image/jpeg', 'image/png', 'image/tiff', 'application/pdf'];
  }

  /**
   * Extract prescription data from uploaded file
   */
  async extractPrescriptionData(file) {
    const trace_id = uuidv4();

    try {
      logger.info('Starting OCR extraction', {
        file_name: file.originalname,
        mime_type: file.mimetype,
        trace_id
      });

      // Preprocess image for better OCR accuracy
      const preprocessedBuffer = await this.preprocessImage(file.buffer || file.path);

      // Perform OCR
      const ocrResult = await Tesseract.recognize(
        preprocessedBuffer,
        'por', // Portuguese
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              logger.debug(`OCR progress: ${Math.round(m.progress * 100)}%`, { trace_id });
            }
          }
        }
      );

      const text = ocrResult.data.text;
      const confidence = ocrResult.data.confidence / 100; // Convert to 0-1

      logger.info('OCR extraction completed', {
        confidence,
        text_length: text.length,
        trace_id
      });

      // Parse extracted text into structured data
      const parsedData = this.parseOCRText(text);

      return {
        provider: this.provider,
        confidence,
        data: parsedData,
        raw_text: text,
        suggestions: this.generateSuggestions(parsedData, confidence),
        trace_id
      };
    } catch (error) {
      logger.error('OCR extraction failed', {
        error: error.message,
        file_name: file.originalname,
        trace_id
      });
      throw new Error(`OCR extraction failed: ${error.message}`);
    }
  }

  /**
   * Preprocess image for better OCR accuracy
   */
  async preprocessImage(input) {
    try {
      return await sharp(input)
        .grayscale() // Convert to grayscale
        .normalize() // Normalize histogram
        .sharpen() // Sharpen text
        .toBuffer();
    } catch (error) {
      logger.warn('Image preprocessing failed, using original', { error: error.message });
      return input;
    }
  }

  /**
   * Parse OCR text into structured prescription data
   */
  parseOCRText(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    
    const data = {
      cliente_nome: null,
      medico_nome: null,
      medico_crm: null,
      medico_uf: null,
      data_emissao: null,
      od: {
        esferico: null,
        cilindrico: null,
        eixo: null,
        dnp: null,
        adicao: null
      },
      oe: {
        esferico: null,
        cilindrico: null,
        eixo: null,
        dnp: null,
        adicao: null
      },
      tipo_lente: null,
      observacoes: null
    };

    // Extract patient name (usually at top)
    const patientMatch = text.match(/paciente:?\s*([A-Za-zÀ-ÿ\s]+)/i);
    if (patientMatch) {
      data.cliente_nome = patientMatch[1].trim();
    }

    // Extract doctor name and CRM
    const doctorMatch = text.match(/dr\.?\s*([A-Za-zÀ-ÿ\s]+)/i);
    if (doctorMatch) {
      data.medico_nome = doctorMatch[1].trim();
    }

    const crmMatch = text.match(/crm[:\s]*([0-9]+)[\s\-\/]*([A-Z]{2})?/i);
    if (crmMatch) {
      data.medico_crm = crmMatch[1];
      data.medico_uf = crmMatch[2] || null;
    }

    // Extract date
    const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      let year = dateMatch[3];
      if (year.length === 2) year = '20' + year;
      data.data_emissao = `${year}-${month}-${day}`;
    }

    // Extract OD (Olho Direito / Right Eye)
    const odPattern = /OD|O\.D|DIREITO/i;
    const odIndex = text.search(odPattern);
    if (odIndex !== -1) {
      const odText = text.substring(odIndex, odIndex + 200);
      data.od = this.extractEyeData(odText);
    }

    // Extract OE (Olho Esquerdo / Left Eye)
    const oePattern = /OE|O\.E|ESQUERDO/i;
    const oeIndex = text.search(oePattern);
    if (oeIndex !== -1) {
      const oeText = text.substring(oeIndex, oeIndex + 200);
      data.oe = this.extractEyeData(oeText);
    }

    // Extract lens type
    const lensTypeMatch = text.match(/(monofocal|bifocal|multifocal|progressiva)/i);
    if (lensTypeMatch) {
      data.tipo_lente = this.normalizeLensType(lensTypeMatch[1]);
    }

    // Extract observations
    const obsMatch = text.match(/observa[çc][õo]es?:?\s*(.+)/i);
    if (obsMatch) {
      data.observacoes = obsMatch[1].trim();
    }

    return data;
  }

  /**
   * Extract eye-specific data (sphere, cylinder, axis, etc)
   */
  extractEyeData(text) {
    const eye = {
      esferico: null,
      cilindrico: null,
      eixo: null,
      dnp: null,
      adicao: null
    };

    // Esférico (Sphere) - can be positive or negative
    const sphereMatch = text.match(/esf[éeê]rico[:\s]*([\+\-]?\d+[.,]?\d*)/i) ||
                       text.match(/esf[:\s]*([\+\-]?\d+[.,]?\d*)/i);
    if (sphereMatch) {
      eye.esferico = parseFloat(sphereMatch[1].replace(',', '.'));
    }

    // Cilíndrico (Cylinder) - usually negative
    const cylinderMatch = text.match(/cil[íií]ndrico[:\s]*([\+\-]?\d+[.,]?\d*)/i) ||
                         text.match(/cil[:\s]*([\+\-]?\d+[.,]?\d*)/i);
    if (cylinderMatch) {
      eye.cilindrico = parseFloat(cylinderMatch[1].replace(',', '.'));
    }

    // Eixo (Axis) - 0-180 degrees
    const axisMatch = text.match(/eixo[:\s]*(\d+)[°º]?/i);
    if (axisMatch) {
      eye.eixo = parseInt(axisMatch[1]);
    }

    // DNP (Distância Naso-Pupilar)
    const dnpMatch = text.match(/dnp[:\s]*(\d+[.,]?\d*)/i);
    if (dnpMatch) {
      eye.dnp = parseFloat(dnpMatch[1].replace(',', '.'));
    }

    // Adição (Add) - for multifocal lenses
    const addMatch = text.match(/adi[çc][ãa]o[:\s]*([\+]?\d+[.,]?\d*)/i) ||
                    text.match(/add[:\s]*([\+]?\d+[.,]?\d*)/i);
    if (addMatch) {
      eye.adicao = parseFloat(addMatch[1].replace(',', '.'));
    }

    return eye;
  }

  /**
   * Normalize lens type to match enum
   */
  normalizeLensType(type) {
    const normalized = type.toLowerCase();
    const mapping = {
      'monofocal': 'Monofocal',
      'bifocal': 'Bifocal',
      'multifocal': 'Multifocal',
      'progressiva': 'Progressiva'
    };
    return mapping[normalized] || 'Monofocal';
  }

  /**
   * Generate suggestions based on parsed data and confidence
   */
  generateSuggestions(parsedData, confidence) {
    const suggestions = [];

    if (confidence < 0.7) {
      suggestions.push({
        type: 'warning',
        message: 'Baixa confiança no OCR. Recomendamos revisar todos os campos manualmente.'
      });
    }

    if (!parsedData.cliente_nome) {
      suggestions.push({
        type: 'missing',
        field: 'cliente_nome',
        message: 'Nome do paciente não detectado. Por favor, preencha manualmente.'
      });
    }

    if (!parsedData.medico_crm) {
      suggestions.push({
        type: 'missing',
        field: 'medico_crm',
        message: 'CRM do médico não detectado. Campo obrigatório.'
      });
    }

    if (!parsedData.od.esferico && !parsedData.oe.esferico) {
      suggestions.push({
        type: 'critical',
        message: 'Valores esféricos não detectados. Verifique a qualidade da imagem.'
      });
    }

    // Validate ranges
    if (parsedData.od.esferico && (parsedData.od.esferico < -20 || parsedData.od.esferico > 20)) {
      suggestions.push({
        type: 'validation',
        field: 'od.esferico',
        message: 'Valor esférico OD fora do intervalo esperado (-20 a +20).'
      });
    }

    if (parsedData.od.eixo && (parsedData.od.eixo < 0 || parsedData.od.eixo > 180)) {
      suggestions.push({
        type: 'validation',
        field: 'od.eixo',
        message: 'Eixo OD fora do intervalo válido (0° a 180°).'
      });
    }

    return suggestions;
  }

  /**
   * Validate file format
   */
  isSupported(mimeType) {
    return this.supportedFormats.includes(mimeType);
  }
}

export default new OCRService();
