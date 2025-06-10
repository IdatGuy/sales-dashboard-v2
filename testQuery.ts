// testQuery.ts
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

async function run() {
  const { data, error } = await supabase
    .from('sales')
    .select('*')

  if (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  console.log('Sales:', data)
  process.exit(0)
}

run()
