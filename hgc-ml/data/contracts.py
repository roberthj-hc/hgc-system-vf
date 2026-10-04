"""Allowlisted Snowflake models and their grains. No gold writes."""
MODELS = {
    'sys_sales_daily': ('SYSTEM', ['id_sucursal', 'fecha']),
    'sys_customer_orders': ('SYSTEM', ['id_pedido']),
    'sys_branch_monthly': ('SYSTEM', ['id_sucursal', 'mes_fecha']),
    'sys_product_weekly': ('SYSTEM', ['id_sucursal', 'id_producto', 'semana']),
}


def validate(frame, keys):
    if frame.empty:
        raise ValueError('Empty source: previous serving snapshot preserved')
    if frame[keys].isna().any().any() or frame.duplicated(keys).any():
        raise ValueError(f'Invalid grain: {keys}')
    for column in ('ingresos', 'pedidos', 'unidades'):
        if column in frame and (frame[column].isna().any() or (frame[column] < 0).any()):
            raise ValueError(f'Invalid measure: {column}')

    if "costo_op_total" in frame and (frame.costo_op_total.dropna() < 0).any():
        raise ValueError("Negative operating cost")
