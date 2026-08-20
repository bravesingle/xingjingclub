/** 服务分类（与小程序端一致） */
export const CATEGORIES = [
  { id: 'rank', name: '排位上分', icon: '🏆', desc: '烽火地带排位' },
  { id: 'loot', name: '摸金带飞', icon: '💎', desc: '物资撤离' },
  { id: 'task', name: '任务通关', icon: '🎯', desc: '行动任务' },
  { id: 'warfare', name: '全面战场', icon: '⚔️', desc: '大战场' }
]

/** 首页 Banner（后续可挪到系统设置动态配置） */
export const BANNERS = [
  { id: 'b1', title: '星竞电竞 · 三角洲行动', subtitle: '大神陪玩 · 稳定上分', gradient: 'linear-gradient(135deg, #3A5BFF, #7B5CFF)' },
  { id: 'b2', title: '烽火地带 · 摸金带飞', subtitle: '高价值物资 · 保底撤离', gradient: 'linear-gradient(135deg, #FFA940, #FF5B6A)' },
  { id: 'b3', title: '新用户专享', subtitle: '首单立减 · 先到先得', gradient: 'linear-gradient(135deg, #2ECC71, #4D7CFF)' }
]

/** 规格折扣：数量/时长越大折扣越大 */
export const SPEC_DISCOUNT: Record<number, number> = {
  1: 1, 2: 0.95, 3: 0.95, 4: 0.9, 5: 0.9, 8: 0.85, 10: 0.85
}

export const CATEGORY_NAME_MAP: Record<string, string> = {
  rank: '排位上分',
  loot: '摸金带飞',
  task: '任务通关',
  warfare: '全面战场'
}

export const MODE_NAME_MAP: Record<string, string> = {
  hazard: '烽火地带',
  warfare: '全面战场'
}
