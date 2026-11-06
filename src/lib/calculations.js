// ============================================================================
// TAPPA 1: Calcolo della Forza Massima Teorica (`calcola1RM` - Formula di Epley)
// OBIETTIVO: Stimare il massimo carico sollevabile per una singola ripetizione (1RM) partendo da un peso e reps qualsiasi, arrotondando il risultato a scaglioni di 0,5 kg.

// ============================================================================
export function calcola1RM(peso, ripetizioni) {
  const p = parseFloat(peso) || 0;
  const r = parseInt(ripetizioni) || 0;
  if (p === 0 || r === 0) return 0;
  
  //formula di Epley
  const raw1RM = p * (1 + r / 30);
  return Math.round(raw1RM * 2) / 2; // Arrotondamento a 0.5 kg
}

// ============================================================================
// TAPPA 2: Aggregazione Volumetrica e Filtro della Sessione (`calcolaVolumeSessione`)
// OBIETTIVO: Calcolare il tonnellaggio totale sollevato cumulando solo le serie allenanti (escludendo i set di riscaldamento ed eventuali inserimenti a zero).

// ============================================================================
export function calcolaVolumeSessione(serie) {
  if (!Array.isArray(serie)) return 0;
  return serie
    .filter(s => !s.is_warmup && (parseInt(s.reps) || 0) >= 1)
    .reduce((acc, curr) => {
      const peso = parseFloat(curr.weight_kg) || 0;
      const reps = parseInt(curr.reps) || 0;
      return acc + (peso * reps);
    }, 0);
}

// ============================================================================
// TAPPA 3: Calcolo dei Delta Statistici Percentuali (`calcolaVariazionePercentuale`)
// OBIETTIVO: Determinare la variazione percentuale tra un parametro di performance attuale e uno storico, restituendo una stringa formattata con segno visivo.

// ============================================================================
export function calcolaVariazionePercentuale(attuale, precedente) {
  const act = parseFloat(attuale) || 0;
  const prev = parseFloat(precedente) || 0;
  if (prev === 0) return "Dati insufficienti";
  
  const variazione = Math.round(((act - prev) / prev) * 100);
  return variazione >= 0 ? `+${variazione}%` : `${variazione}%`;
}

// ============================================================================
// TAPPA 4: Algoritmo di Classificazione Obiettivi Antropometrici (`determinaTipoObiettivo`)
// OBIETTIVO: Classificare la tipologia di percorso fitness di un utente (Massa, Dimagrimento o Mantenimento) analizzando lo scostamento tra il peso corporeo iniziale e il target finale.

// ============================================================================
export function determinaTipoObiettivo(partenza, target) {
  const p = parseFloat(partenza) || 0;
  const t = parseFloat(target) || 0;
  if (!p || !t) return null;
  
  if (t > p) return "Massa";
  if (t < p) return "Dimagrimento";
  
  // Se la differenza è minima (sotto 0,5 kg), l'obiettivo è considerato raggiunto/mantenimento
  if (Math.abs(t - p) < 0.5) return "Mantenimento";
  return "Mantenimento";
}
