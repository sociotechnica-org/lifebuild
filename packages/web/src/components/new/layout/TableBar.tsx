import React from 'react'
import { TableSlot } from './TableSlot.js'

/**
 * TableBar component - The persistent bottom bar showing The Table (Gold, Silver, Bronze streams).
 * This shows the top priority projects across the three work streams.
 *
 * TODO: Wire up to table_config entity when it exists in schema.
 * For now, this shows empty slots as a foundation for the persistent layout.
 */
export const TableBar: React.FC = () => {
  // TODO: Query table configuration from database when schema is ready
  // const tableConfig = useQuery(db => db.table('table_config').findOne({ id: 'default' }), [])

  // For now, show empty slots
  // In the future, this will query:
  // - Gold project ID and details
  // - Silver project ID and details
  // - Bronze stack top item and count

  return (
    <div className='new-ui-table-bar'>
      <div className='new-ui-table-grid'>
        <TableSlot stream='gold' />
        <TableSlot stream='silver' />
        <TableSlot stream='bronze' />
      </div>
    </div>
  )
}
