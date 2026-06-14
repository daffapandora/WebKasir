import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos } = await supabase.from('todos').select()

  return (
    <ul className="p-8 space-y-2">
      <h1 className="text-xl font-bold mb-4">Supabase Server Component Connection Test</h1>
      {todos && todos.length > 0 ? (
        todos.map((todo) => (
          <li key={todo.id} className="border p-2 rounded max-w-sm">
            {todo.name}
          </li>
        ))
      ) : (
        <p className="text-muted text-sm">Tidak ada data todo atau tabel 'todos' belum terbuat.</p>
      )}
    </ul>
  )
}
