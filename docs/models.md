# Contratos y modelos

| OBT SYSTEM | Grano | Uso |
|---|---|---|
| sys_sales_daily | sucursal / fecha | Ventas, proyección de apertura y rentabilidad |
| sys_customer_orders | pedido completado con cliente | Fuente temporal para cohortes |
| sys_customer_features | cliente / fecha de corte | CLV e inactividad a 90 días |
| sys_branch_monthly | sucursal / mes completo | Costos, rentabilidad y eficiencia |
| sys_product_weekly | sucursal / producto / semana completa | Modelo de precio y margen |

Los cortes usan America/La_Paz; se excluyen fechas futuras y periodos agregados incompletos. Las dimensiones y hechos Gold no se seleccionan ni se modifican. El comando dbt selecciona `+tag:system` y excluye `path:models/marts`.

## Evaluación y significado

| Pantalla | Modelo / cálculo | Evaluación |
|---|---|---|
| Ventas semanales | Referencia estacional entrenada frente a Ridge calendario | Últimos 84 días; MAE de ingresos/pedidos |
| Valor del Cliente | Random Forest frente a media de gasto | Cohortes cronológicas; selección RMSE, prueba RMSE/MAE |
| Fuga de Clientes | Random Forest frente a frecuencia poblacional | Cohortes cronológicas; Brier y ROC AUC |
| Monitor de eficiencia | Ridge sobre log de costo operativo y volumen | Últimos tres meses con costo observado |
| Optimizador de margen | Ridge log-log con controles producto/sucursal y mes | Últimas doce semanas; MAE de unidades |
| Detección de rentabilidad | Ingresos, costo estándar de producto y costos operativos; escenario con modelos de ventas/costos | Métricas de ambos modelos; sin afirmar precisión independiente de utilidad |
| Apertura de sucursales | Analogía de sucursal + pronósticos de ventas/costos | Escenario condicionado a factor explícito de demanda |

Clientes usan ventanas históricas de 180 días y etiquetas futuras de 90 días. Ocho cohortes separadas por 90 días evitan solapar las ventanas objetivo entre particiones; solo se entrenan etiquetas maduras. La cohorte más reciente no tiene etiquetas. La antigüedad de registro MongoDB se calcula a la fecha del corte; no se incluyen atributos actuales que filtren información futura. El test final queda fuera de la selección; después se reajusta para producción. Semilla 42 y tamaños de muestra acotados hacen reproducible el entrenamiento.

Un modelo más complejo puede perder contra la referencia. En ese caso se publica la referencia y se muestra expresamente que no existe ranking individual validado. No se fabrica variación de predicciones para aparentar personalización. CLV significa **ingreso esperado a 90 días**, no utilidad ni valor de vida completo; fuga significa **inactividad durante 90 días**, no baja definitiva.

## Límites de los datos

Los costos disponibles corresponden a alquiler y servicios básicos y presentan retraso frente a las ventas. El sistema conserva su fecha de corte y no transforma costos ausentes en ceros observados. El costo de producto usa el estándar actual: no es contabilidad histórica de costos. No se debe interpretar la proyección como utilidad contable completa.

La regresión de precio es observacional. Si la elasticidad, variación de precio o soporte histórico no permiten recomendar cambios, se conserva el precio actual. El usuario puede explorar el modelo y escenarios de elasticidad explícita, identificados como supuestos; no se presentan como un efecto causal validado.

## Trazabilidad

Cada carga tiene identificador, filas y SHA-256 por OBT. Cada run MLflow incluye carga, huella de fuentes, revisión Git cuando está disponible, parámetros, métricas, firma y ejemplo de entrada. Una publicación enlaza los siete reportes y los scores de clientes con una sola carga. Las peticiones combinadas de rentabilidad/apertura fijan la misma publicación para todos los modelos.

Los notebooks registran experimentos pero no activan publicaciones. La activación es responsabilidad de `main.py train` y del DAG, después de completar todos los módulos y sus validaciones.
