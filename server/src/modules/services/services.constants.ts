/** 服务分类（与小程序端一致） */
export const CATEGORIES = [
  { id: 'rank', name: '排位', icon: '🏆', desc: '烽火地带排位' },
  { id: 'loot', name: '摸金', icon: '💎', desc: '物资撤离' },
  { id: 'task', name: '任务通关', icon: '🎯', desc: '行动任务' },
  { id: 'warfare', name: '全面战场', icon: '⚔️', desc: '大战场' }
]

/** 首页 Banner（后续可挪到系统设置动态配置）
 *  linkType: service 跳服务详情 / category 跳分类列表 / page 跳指定页面（如优惠页）
 *  linkId: 目标服务 id 或分类 id（page 类型可不填）
 */
export const BANNERS = [
  { id: 'b1', title: '星竞电竞 · 三角洲行动', subtitle: '大神组队 · 快乐开黑', gradient: 'linear-gradient(135deg, #3A5BFF, #7B5CFF)', linkType: 'category', linkId: 'rank' },
  { id: 'b2', title: '烽火地带 · 摸金', subtitle: '高价值物资 · 安全撤离', gradient: 'linear-gradient(135deg, #FFA940, #FF5B6A)', linkType: 'category', linkId: 'loot' },
  { id: 'b3', title: '新用户专享', subtitle: '首单立减 · 先到先得', gradient: 'linear-gradient(135deg, #2ECC71, #4D7CFF)', linkType: 'page', linkId: '' }
]

/** 规格折扣：数量/时长越大折扣越大 */
export const SPEC_DISCOUNT: Record<number, number> = {
  1: 1, 2: 0.95, 3: 0.95, 4: 0.9, 5: 0.9, 8: 0.85, 10: 0.85
}

export const CATEGORY_NAME_MAP: Record<string, string> = {
  rank: '排位',
  loot: '摸金',
  task: '任务通关',
  warfare: '全面战场'
}

export const MODE_NAME_MAP: Record<string, string> = {
  hazard: '烽火地带',
  warfare: '全面战场'
}
