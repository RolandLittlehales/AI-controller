import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DefaultLayout from './default.vue'

describe('DefaultLayout', () => {
  it('should render layout with slot content', () => {
    const wrapper = mount(DefaultLayout, {
      slots: {
        default: '<div class="test-content">Test Content</div>'
      }
    })
    
    expect(wrapper.find('.full-height').exists()).toBe(true)
    expect(wrapper.find('.test-content').exists()).toBe(true)
    expect(wrapper.text()).toContain('Test Content')
  })

  it('should render empty layout when no slot content provided', () => {
    const wrapper = mount(DefaultLayout)
    
    expect(wrapper.find('.full-height').exists()).toBe(true)
    expect(wrapper.text()).toBe('')
  })

  it('should have correct CSS class structure', () => {
    const wrapper = mount(DefaultLayout)
    
    expect(wrapper.classes()).toContain('full-height')
  })

  it('should accept multiple slot elements', () => {
    const wrapper = mount(DefaultLayout, {
      slots: {
        default: `
          <div class="header">Header</div>
          <div class="content">Content</div>
          <div class="footer">Footer</div>
        `
      }
    })
    
    expect(wrapper.find('.header').exists()).toBe(true)
    expect(wrapper.find('.content').exists()).toBe(true)
    expect(wrapper.find('.footer').exists()).toBe(true)
  })
})