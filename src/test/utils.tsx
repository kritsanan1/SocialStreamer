import React, { ReactElement } from 'react'

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        {children}
      </Router>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock user for tests
export const mockUser = {
  id: 'user-1',
  email: 'admin@example.com',
  username: 'admin',
  role: 'admin' as const,
  ayrshareProfileKey: 'profile-key-123',
  socialAccounts: [
    {
      id: 'account-1',
      platform: 'facebook',
      accountName: 'Test Facebook Page',
      status: 'connected' as const
    }
  ]
}

// Mock localStorage
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

// Setup localStorage mock
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})