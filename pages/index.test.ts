import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import IndexPage from './index.vue'

// Mock Terminal component - it has its own comprehensive tests
vi.mock('~/components/Terminal.vue', () => ({
  default: {
    name: 'Terminal',
    template: '<div class="mock-terminal">Terminal Component</div>',
    props: ['autoConnect']
  }
}))

// Mock ClientOnly component for testing
const ClientOnlyMock = {
  name: 'ClientOnly',
  template: '<template v-if="mounted"><slot /></template><template v-else><slot name="fallback" /></template>',
  data() {
    return { mounted: false }
  }
}



describe('IndexPage', () => {
  it('should render page with correct title', () => {
    const wrapper = mount(IndexPage)
    
    expect(wrapper.find('h1').text()).toBe('AI Agent Manager')
    expect(wrapper.find('h2').text()).toBe('🚀 Welcome to AI Agent Manager')
  })

  it('should display application description', () => {
    const wrapper = mount(IndexPage)
    
    expect(wrapper.text()).toContain('A powerful web application for managing multiple terminal-based AI instances')
  })

  it('should render feature list', () => {
    const wrapper = mount(IndexPage)
    
    const featureItems = wrapper.findAll('.features-list-item')
    expect(featureItems).toHaveLength(4)
    
    const featureTexts = featureItems.map(item => item.text())
    expect(featureTexts).toContain('Multi-terminal management')
    expect(featureTexts).toContain('Git worktree integration')
    expect(featureTexts).toContain('Real-time communication')
    expect(featureTexts).toContain('Session persistence')
  })

  it('should display version and status information', () => {
    const wrapper = mount(IndexPage)
    
    expect(wrapper.text()).toContain('Version: 0.1.0')
    expect(wrapper.text()).toContain('Status: Ready')
  })

  it('should display technology stack information', () => {
    const wrapper = mount(IndexPage)
    
    expect(wrapper.find('footer').text()).toBe('Built with Nuxt 3, TypeScript, and vanilla-extract')
  })

  it('should have proper semantic HTML structure', () => {
    const wrapper = mount(IndexPage)
    
    expect(wrapper.find('header').exists()).toBe(true)
    expect(wrapper.find('main').exists()).toBe(true)
    expect(wrapper.find('footer').exists()).toBe(true)
  })

  it('should have proper heading hierarchy', () => {
    const wrapper = mount(IndexPage)
    
    const h1 = wrapper.find('h1')
    const h2 = wrapper.find('h2')
    
    expect(h1.exists()).toBe(true)
    expect(h2.exists()).toBe(true)
    expect(h1.text()).toBe('AI Agent Manager')
    expect(h2.text()).toBe('🚀 Welcome to AI Agent Manager')
  })

  it('should render feature description text', () => {
    const wrapper = mount(IndexPage)
    
    expect(wrapper.find('.features-text').text()).toBe('This application helps you manage multiple CLI-based AI tools with:')
  })

  it('should render application subtitle', () => {
    const wrapper = mount(IndexPage)
    
    expect(wrapper.find('.header-subtitle').text()).toBe('A powerful web application for managing multiple terminal-based AI instances')
  })

  it('should include Terminal component wrapped in ClientOnly', () => {
    const wrapper = mount(IndexPage, {
      global: {
        stubs: {
          ClientOnly: ClientOnlyMock
        }
      }
    })
    
    // Check for terminal section container
    expect(wrapper.find('.terminal-section').exists()).toBe(true)
    // In testing environment, ClientOnly renders the fallback
    expect(wrapper.text()).toContain('Loading terminal...')
  })

  it('should have terminal section with proper styling', () => {
    const wrapper = mount(IndexPage)
    
    const terminalSection = wrapper.find('.terminal-section')
    expect(terminalSection.exists()).toBe(true)
    expect(terminalSection.classes()).toContain('terminal-section')
  })
})