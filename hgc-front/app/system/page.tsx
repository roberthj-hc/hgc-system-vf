export default function Page() {

  return (

    <div className="flex flex-1 flex-col gap-6 py-6 px-4 md:px-6">

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Bienvenido al Sistema BI
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Plataforma de análisis e inteligencia de negocios de Hermanos Golden Chicken.
          Centraliza la información operativa y transforma datos en decisiones estratégicas.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
          <h2 className="text-lg font-semibold">Visión del negocio</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Supervisa el rendimiento de sucursales en La Paz, El Alto, Cochabamba y Santa Cruz
            desde un solo lugar, con métricas clave en tiempo real.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
          <h2 className="text-lg font-semibold">Datos centralizados</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Integra ventas en tienda, delivery, pagos QR e inventarios en una única fuente
            de verdad para eliminar la fragmentación de información.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
          <h2 className="text-lg font-semibold">Decisiones inteligentes</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Convierte miles de transacciones diarias en insights accionables para mejorar
            la rentabilidad, optimizar operaciones y anticipar la demanda.
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-muted/30 p-6 flex flex-col gap-3">
        <h2 className="text-xl font-semibold">
          Enfoque del sistema
        </h2>
        <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
          Este sistema ha sido diseñado para resolver la fragmentación de datos generada por la
          operación omnicanal de la empresa. A través de un modelo centralizado, permite analizar
          el desempeño comercial, controlar inventarios, reducir mermas y mejorar la eficiencia
          operativa en cada sucursal.
        </p>
      </div>

      <div className="text-xs text-muted-foreground">
        Hermanos Golden Chicken · Sistema de Inteligencia de Negocios
      </div>

    </div>

  )
}