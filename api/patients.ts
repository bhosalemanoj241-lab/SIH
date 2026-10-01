// Vercel Serverless Function & Vite Middleware: /api/patients
// Central Persistent Patient Registry for MediBridge AI

import {
  getDatabase,
  saveDatabase,
  findPatientByIdentifier,
  PatientProfile
} from './centralDb';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,PATCH,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const db = getDatabase();

  // ─────────────────────────────────────────────────────────────────────────
  // GET: Fetch all patients or query by Patient ID / Email
  // ─────────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const q = req.query?.patientId || req.query?.id || req.query?.email || req.query?.q;

    if (q) {
      const found = findPatientByIdentifier(q);
      if (found) {
        const { password: _p, ...safePatient } = found;
        return res.status(200).json({ success: true, patient: safePatient, data: safePatient });
      }
      return res.status(404).json({ success: false, notFound: true, error: `Patient with identifier "${q}" not found` });
    }

    const safeList = db.patients.map(({ password: _p, ...rest }) => rest);
    return res.status(200).json({
      success: true,
      count: safeList.length,
      patients: safeList,
      data: safeList
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST / PUT: Create or update patient in central database
  // ─────────────────────────────────────────────────────────────────────────
  if (req.method === 'POST' || req.method === 'PUT') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const incoming = body.patient || body.data || body;

    if (!incoming || (!incoming.patientId && !incoming.email && !incoming.fullName)) {
      return res.status(400).json({ success: false, error: 'Valid patient record is required.' });
    }

    const pId = String(incoming.patientId || '').trim().toUpperCase();
    const pEmail = String(incoming.email || '').trim().toLowerCase();

    // Check if patient exists to update
    const idx = db.patients.findIndex(
      p => (pId && (p.patientId || '').toUpperCase() === pId) || (pEmail && (p.email || '').toLowerCase() === pEmail)
    );

    let savedPatient: PatientProfile;
    if (idx >= 0) {
      db.patients[idx] = { ...db.patients[idx], ...incoming };
      savedPatient = db.patients[idx];
    } else {
      savedPatient = {
        ...incoming,
        patientId: pId || `MB-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        status: incoming.status || 'ACTIVE',
        createdAt: incoming.createdAt || new Date().toISOString()
      };
      db.patients.unshift(savedPatient);
    }

    saveDatabase(db);
    const { password: _p, ...safePatient } = savedPatient;

    return res.status(200).json({
      success: true,
      patient: safePatient,
      data: safePatient
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE: Remove patient
  // ─────────────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const q = req.query?.patientId || req.query?.id;
    if (!q) {
      return res.status(400).json({ success: false, error: 'patientId query parameter is required for deletion' });
    }

    const cleanId = String(q).trim().toUpperCase();
    db.patients = db.patients.filter(p => (p.patientId || '').toUpperCase() !== cleanId && p.id !== cleanId);
    saveDatabase(db);

    return res.status(200).json({ success: true, message: `Patient ${cleanId} removed` });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
