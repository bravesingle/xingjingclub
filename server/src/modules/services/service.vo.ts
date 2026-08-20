import { GameService } from './service.entity'
import { ServiceSpec } from './service-spec.entity'

/** 服务对外 VO（specs 按 value 排序，时间转毫秒） */
export function toServiceVO(service: GameService) {
  const specs = (service.specs || [])
    .slice()
    .sort((a, b) => a.value - b.value)
    .map((s: ServiceSpec) => ({ value: s.value, label: s.label, price: s.price }))
  return {
    id: service.id,
    title: service.title,
    subtitle: service.subtitle,
    category: service.category,
    categoryName: service.categoryName,
    mode: service.mode,
    modeName: service.modeName,
    priceUnit: service.priceUnit,
    unitName: service.unitName,
    basePrice: service.basePrice,
    cover: service.cover,
    coverGradient: service.coverGradient,
    coverText: service.coverText,
    tags: service.tags || [],
    serviceRules: service.serviceRules || [],
    notice: service.notice || [],
    sales: service.sales,
    rating: service.rating,
    isOnSale: service.isOnSale,
    specs,
    createdAt: service.createdAt ? new Date(service.createdAt).getTime() : null
  }
}
