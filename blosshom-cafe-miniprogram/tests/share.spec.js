import { SHARE_TITLE, shareToFriends, shareToTimeline } from '../src/config/share'

describe('public sharing', () => {
  test('shares only public pages without table or order context', () => {
    expect(shareToFriends('/pages/menu/index')).toEqual({
      title: SHARE_TITLE,
      path: '/pages/menu/index'
    })
  })

  test('uses a context-free timeline entry', () => {
    expect(shareToTimeline()).toEqual({ title: SHARE_TITLE, query: '' })
  })
})
