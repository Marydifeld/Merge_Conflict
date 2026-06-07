import { useState, useEffect } from 'react'
import rawData from '../data/dashboard_data.json'

export function useDashboardData() {
  const [data, setData] = useState({
    metadata: {},
    kpisGlobales: {},
    serieTiempoGlobal: [],
    serieTiempoSubchannel: {},
    mapaRiesgoTerritorio: [],
    kpisPorSubchannel: [],
    top50ClientesRiesgo: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    try {
      setData({
        metadata: rawData.metadata || {},
        kpisGlobales: rawData.kpis_globales || {},
        serieTiempoGlobal: rawData.serie_tiempo_global || [],
        serieTiempoSubchannel: rawData.serie_tiempo_subchannel || {},
        mapaRiesgoTerritorio: rawData.mapa_riesgo_territorio || [],
        kpisPorSubchannel: rawData.kpis_por_subchannel || [],
        top50ClientesRiesgo: rawData.top_50_clientes_riesgo || [],
        loading: false,
        error: null
      })
    } catch (err) {
      console.error('Error parsing dashboard data:', err)
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Error al cargar los datos del dashboard.'
      }))
    }
  }, [])

  return data
}
