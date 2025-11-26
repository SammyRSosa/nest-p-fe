// 📁 DepartmentTable.tsx - ACTUALIZAR LAS COLUMNAS DE LA TABLA

// En la tabla, actualizar las celdas para mostrar datos correctos:

<TableRow key={department.id}>
  <TableCell>
    <div>
      <div className="font-medium">{department.name}</div>
    </div>
  </TableCell>
  <TableCell>
    {department.headOfDepartment ? (
      <div className="flex items-center gap-2">
        <UserCheck className="h-4 w-4 text-green-600" />
        <span>{department.headOfDepartment.worker.name}</span>
      </div>
    ) : (
      <span className="text-muted-foreground">Sin jefe</span>
    )}
  </TableCell>
  <TableCell>
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4" />
      {/* Mostrar contador de trabajadores asignados */}
      <span>{department.workers?.length || 0}</span>
    </div>
  </TableCell>
  {/* ... resto de las celdas ... */}
</TableRow>