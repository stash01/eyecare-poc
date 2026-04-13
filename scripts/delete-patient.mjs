// Usage: node scripts/delete-patient.mjs <email>
// Deletes a patient and all their associated data (assessments, appointments, etc.)
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local
const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('=').map(s => s.trim()))
    .filter(([k]) => k)
    .map(([k, ...v]) => [k, v.join('=')])
)

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

const email = process.argv[2]
if (!email) {
  console.error('Usage: node scripts/delete-patient.mjs <email>')
  process.exit(1)
}

const { data: patient, error: fetchErr } = await supabase
  .from('patients')
  .select('id, email')
  .eq('email', email)
  .single()

if (fetchErr || !patient) {
  console.error(`No patient found with email: ${email}`)
  process.exit(1)
}

console.log(`Found patient: ${patient.email} (id: ${patient.id})`)

// Delete in dependency order
const steps = [
  { table: 'emr_note_retry_queue', col: 'appointment_id', via: 'appointments' },
  { table: 'appointments', col: 'patient_id' },
  { table: 'assessments', col: 'patient_id' },
  { table: 'audit_log', col: 'patient_id' },
  { table: 'sessions', col: 'patient_id' },
  { table: 'subscriptions', col: 'patient_id' },
  { table: 'patients', col: 'id' },
]

for (const step of steps) {
  if (step.via) {
    // Get appointment IDs first
    const { data: appts } = await supabase.from('appointments').select('id').eq('patient_id', patient.id)
    if (appts?.length) {
      const ids = appts.map(a => a.id)
      const { error } = await supabase.from(step.table).delete().in('appointment_id', ids)
      if (error) console.warn(`  ${step.table}: ${error.message}`)
      else console.log(`  deleted from ${step.table}`)
    }
    continue
  }
  const { error } = await supabase.from(step.table).delete().eq(step.col, patient.id)
  if (error) console.warn(`  ${step.table}: ${error.message}`)
  else console.log(`  deleted from ${step.table}`)
}

console.log(`\nDone — ${email} can now re-register.`)
