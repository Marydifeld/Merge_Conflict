"""
Genera preds_submission.csv con target = 0/1 basado en el modelo de churn.
- Clientes con historial suficiente (>=3 meses): predicción del modelo
- Clientes con historial insuficiente o sin datos: target = 0
"""
import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import LabelEncoder
import warnings
warnings.filterwarnings('ignore')

UMBRAL_CHURN = 0.5  # prob_churn > UMBRAL → target = 1

# ── Cargar datos ───────────────────────────────────────────────────────────────
print("Cargando archivos...")
df_hist    = pd.read_csv('df_mensual.csv')
df_sub     = pd.read_csv('preds_submission.csv')
modelo     = joblib.load('modelo_churn.pkl')

print(f"  df_mensual : {len(df_hist):,} filas  |  {df_hist['customer_id'].nunique():,} clientes")
print(f"  preds_submission: {len(df_sub):,} filas  |  {df_sub['customer_id'].nunique():,} clientes")

# ── Validar y limpiar ──────────────────────────────────────────────────────────
COLS_REQ = ['customer_id', 'calmonth', 'num_transacciones', 'uni_boxes_sold_m']
COLS_OPT = ['num_coolers', 'num_doors']

for col in COLS_OPT:
    if col not in df_hist.columns:
        df_hist[col] = 0
    else:
        df_hist[col] = df_hist[col].fillna(0)

# Filtrar filas inválidas (customer_id vacío, calmonth inválido, valores nulos)
mask = (
    df_hist['customer_id'].notna() &
    (df_hist['customer_id'].astype(str).str.strip() != '') &
    df_hist['calmonth'].notna() &
    df_hist['num_transacciones'].notna() &
    df_hist['uni_boxes_sold_m'].notna() &
    (df_hist['num_transacciones'] >= 0) &
    (df_hist['uni_boxes_sold_m'] >= 0)
)
df_limpio = df_hist[mask].copy()
print(f"\nFilas válidas: {len(df_limpio):,}  |  descartadas: {(~mask).sum():,}")

# ── Calcular features ──────────────────────────────────────────────────────────
print("Calculando features...")
df_limpio = df_limpio.sort_values(['customer_id', 'calmonth'])

# Excluir última fila por cliente sin depender de groupby().apply()
rev_rank      = df_limpio.groupby('customer_id').cumcount(ascending=False)
df_sin_ultimo = df_limpio[rev_rank > 0].copy()

conteo = df_limpio.groupby('customer_id').size()
clientes_sin_historial = set(conteo[conteo < 3].index)
print(f"  Sin historial suficiente (<3 meses): {len(clientes_sin_historial):,}")

agg = df_limpio.groupby('customer_id').agg(
    meses_activo      = ('calmonth',          'count'),
    avg_transacciones = ('num_transacciones',  'mean'),
    avg_cajas         = ('uni_boxes_sold_m',   'mean'),
    avg_coolers       = ('num_coolers',         'mean'),
    avg_doors         = ('num_doors',           'mean'),
).reset_index()

temp = df_sin_ultimo.groupby('customer_id').agg(
    ventas_ultimo_mes    = ('uni_boxes_sold_m', 'last'),
    ventas_penultimo     = ('uni_boxes_sold_m', lambda x: x.iloc[-2] if len(x) >= 2 else x.iloc[-1]),
    ventas_antepenultimo = ('uni_boxes_sold_m', lambda x: x.iloc[-3] if len(x) >= 3 else x.iloc[-1]),
    meses_sin_venta      = ('num_transacciones', lambda x: (x == 0).sum()),
    max_coolers          = ('num_coolers', 'max'),
    ultimo_cooler        = ('num_coolers', 'last'),
).reset_index()

temp['perdio_cooler'] = ((temp['max_coolers'] > 0) & (temp['ultimo_cooler'] == 0)).astype(int)
df_features = agg.merge(temp, on='customer_id', how='left')

# Columnas categóricas — tomar de demo_clientes si existen, si no: 'Desconocido'
cats = ['territory_d', 'comercial_subchannel_d', 'rtm_customer_size_d']
if all(c in df_limpio.columns for c in cats):
    cat_info = (
        df_limpio.groupby('customer_id')[cats]
        .last()
        .reset_index()
    )
    df_features = df_features.merge(cat_info, on='customer_id', how='left')
else:
    for c in cats:
        df_features[c] = 'Desconocido'

for c in cats:
    df_features[c] = df_features[c].fillna('Desconocido')

# ── Predecir ───────────────────────────────────────────────────────────────────
df_predecir = df_features[~df_features['customer_id'].isin(clientes_sin_historial)].copy()
print(f"  Clientes a predecir: {len(df_predecir):,}")

# Leer nombres exactos de features desde el modelo (evita problemas de encoding con ñ)
feat_names  = modelo.get_booster().feature_names
feat3_name  = feat_names[2]  # e.g. 'tamaño_enc'

le = LabelEncoder()
df_predecir['territorio_enc'] = le.fit_transform(df_predecir['territory_d'].astype(str))
df_predecir['subchannel_enc'] = le.fit_transform(df_predecir['comercial_subchannel_d'].astype(str))
df_predecir[feat3_name]       = le.fit_transform(df_predecir['rtm_customer_size_d'].astype(str))

X = df_predecir[[
    'territorio_enc', 'subchannel_enc', feat3_name,
    'meses_activo', 'avg_transacciones', 'avg_cajas',
    'avg_coolers', 'avg_doors', 'ventas_ultimo_mes',
    'ventas_penultimo', 'ventas_antepenultimo',
    'meses_sin_venta', 'perdio_cooler'
]]

probs = modelo.predict_proba(X)[:, 1]
df_predecir['prob_churn'] = probs
df_predecir['target']     = (probs > UMBRAL_CHURN).astype(int)

print(f"\n  Umbral: {UMBRAL_CHURN}")
print(f"  Churn=1: {(df_predecir['target']==1).sum():,}  |  Churn=0: {(df_predecir['target']==0).sum():,}")

# ── Llenar submission ──────────────────────────────────────────────────────────
print("\nGenerando preds_submission.csv...")

pred_map = df_predecir.set_index('customer_id')['target'].to_dict()

df_sub['target'] = df_sub['customer_id'].map(pred_map)

# Clientes sin datos → 0
sin_datos = df_sub['target'].isna().sum()
df_sub['target'] = df_sub['target'].fillna(0).astype(int)

print(f"  Con predicción del modelo : {len(pred_map):,}")
print(f"  Sin datos (asignado 0)    : {sin_datos:,}")
print(f"  Total filas en submission : {len(df_sub):,}")
print(f"  target=1 en submission    : {(df_sub['target']==1).sum():,}")
print(f"  target=0 en submission    : {(df_sub['target']==0).sum():,}")

df_sub.to_csv('preds_submission.csv', index=False)
print("\npreds_submission.csv guardado.")
