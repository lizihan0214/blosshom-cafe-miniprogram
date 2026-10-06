export const SHARE_TITLE = '繁花 Blosshom & Cafe｜咖啡、餐食与微醺'

export function shareToFriends(path = '/pages/home/index') {
  return { title: SHARE_TITLE, path }
}

export function shareToTimeline() {
  return { title: SHARE_TITLE, query: '' }
}
