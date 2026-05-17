import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from '../App';

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    BrowserRouter: ({ children }) => <div data-testid="mock-browser-router">{children}</div>,
    Routes: ({ children }) => <div data-testid="mock-routes">{children}</div>,
    Route: ({ element }) => <div data-testid="mock-route">{element}</div>,
    useNavigate: () => jest.fn(), // Not used in App.jsx, but required for children
  };
});

jest.mock("../pages/Login", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-login">Mock Login Page</div>,
}));

jest.mock("../pages/Signup", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-signup">Mock Signup Page</div>,
}));

jest.mock("../pages/Dashboard", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-dashboard">Mock Dashboard Page</div>,
}));

jest.mock("../pages/AddLostItem", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-add-lost-item">Mock Add Lost Item Page</div>,
}));

jest.mock("../pages/Profile", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-profile">Mock Profile Page</div>,
}));

describe('App() App method', () => {
  describe("Happy paths", () => {
    test("renders Login page at root path '/'", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>
      );
      expect(screen.getByTestId("mock-login")).toBeInTheDocument();
      expect(screen.queryByTestId("mock-signup")).not.toBeInTheDocument();
      expect(screen.queryByTestId("mock-dashboard")).not.toBeInTheDocument();
      expect(screen.queryByTestId("mock-add-lost-item")).not.toBeInTheDocument();
      expect(screen.queryByTestId("mock-profile")).not.toBeInTheDocument();
    });

    test("renders Signup page at '/signup'", () => {
      render(
        <MemoryRouter initialEntries={["/signup"]}>
          <App />
        </MemoryRouter>
      );
      expect(screen.getByTestId("mock-signup")).toBeInTheDocument();
      expect(screen.queryByTestId("mock-login")).not.toBeInTheDocument();
      expect(screen.queryByTestId("mock-dashboard")).not.toBeInTheDocument();
      expect(screen.queryByTestId("mock-add-lost-item")).not.toBeInTheDocument();
      expect(screen.queryByTestId("mock-profile")).not.toBeInTheDocument();
    });

    test("renders Dashboard page at '/dashboard'", () => {
      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <App />
        </MemoryRouter>
      );
      expect(screen.getByTestId("mock-dashboard")).toBeInTheDocument();
      expect(screen.queryByTestId("mock-login")).not.toBeInTheDocument();
      expect(screen.queryByTestId("mock-signup")).not.toBeInTheDocument();
      expect(screen.queryByTestId("mock-add-lost-item")).not.toBeInTheDocument();
      expect(screen.queryByTestId("mock-profile")).not.toBeInTheDocument();
    });

    test("renders AddLostItem page at '/add-item'", () => {
      render(
        <MemoryRouter initialEntries={["/add-item"]}>
          <App />
        </MemoryRouter>
      );
      expect(screen.getByTestId("mock-add-lost-item")).toBeInTheDocument();
      expect(screen.queryByTestId("mock-login")).not.toBeInTheDocument();
      expect(screen.queryByTestId("mock-signup")).not.toBeInTheDocument();
      expect(screen.queryByTestId("mock-dashboard")).not.toBeInTheDocument();
      expect(screen.queryByTestId("mock-profile")).not.toBeInTheDocument();
    });

    test("renders Profile page at '/profile'", () => {
      render(
        <MemoryRouter initialEntries={["/profile"]}>
          <App />
        </MemoryRouter>
      );
      expect(screen.getByTestId("mock-profile")).toBeInTheDocument();
      expect(screen.queryByTestId("mock-login")).not.toBeInTheDocument();
      expect(screen.queryByTestId("mock-signup")).not.toBeInTheDocument();
      expect(screen.queryByTestId("mock-dashboard")).not.toBeInTheDocument();
      expect(screen.queryByTestId("mock-add-lost-item")).not.toBeInTheDocument();
    });

    test("renders only one route at a time (no multiple pages)", () => {
      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <App />
        </MemoryRouter>
      );
      expect(screen.getByTestId("mock-dashboard")).toBeInTheDocument();
      expect(screen.queryByTestId("mock-login")).not.toBeInTheDocument();
      expect(screen.queryByTestId("mock-signup")).not.toBeInTheDocument();
      expect(screen.queryByTestId("mock-add-lost-item")).not.toBeInTheDocument();
      expect(screen.queryByTestId("mock-profile")).not.toBeInTheDocument();
    });

    test("App renders BrowserRouter and Routes structure", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>
      );
      expect(screen.getByTestId("mock-browser-router")).toBeInTheDocument();
      expect(screen.getByTestId("mock-routes")).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    test("renders nothing for an unknown route (no match)", () => {
      render(
        <MemoryRouter initialEntries={["/unknown-route"]}>
          <App />
        </MemoryRouter>
      );
      expect(screen.queryByTestId("mock-login")).not.toBeInTheDocument();
      expect(screen.queryByTestId("mock-signup")).not.toBeInTheDocument();
      expect(screen.queryByTestId("mock-dashboard")).not.toBeInTheDocument();
      expect(screen.queryByTestId("mock-add-lost-item")).not.toBeInTheDocument();
      expect(screen.queryByTestId("mock-profile")).not.toBeInTheDocument();
      expect(screen.queryByTestId("mock-route")).not.toBeInTheDocument();
    });

    test("renders Login page for empty path '' (edge case)", () => {
      render(
        <MemoryRouter initialEntries={[""]}>
          <App />
        </MemoryRouter>
      );
      expect(screen.getByTestId("mock-login")).toBeInTheDocument();
    });

    test("renders Login page for root path with trailing slash '/'", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>
      );
      expect(screen.getByTestId("mock-login")).toBeInTheDocument();
    });

    test("renders correct page when navigating between routes", () => {
      const { rerender } = render(
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>
      );
      expect(screen.getByTestId("mock-login")).toBeInTheDocument();

      rerender(
        <MemoryRouter initialEntries={["/signup"]}>
          <App />
        </MemoryRouter>
      );
      expect(screen.getByTestId("mock-signup")).toBeInTheDocument();

      rerender(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <App />
        </MemoryRouter>
      );
      expect(screen.getByTestId("mock-dashboard")).toBeInTheDocument();
    });

    test("does not crash if children components throw (error boundary not present)", () => {
      const ThrowingComponent = () => {
        throw new Error("Test error");
      };
      jest.doMock("./pages/Login", () => ({
        __esModule: true,
        default: ThrowingComponent,
      }));
      const AppWithThrow = require("../App").default;
      expect(() =>
        render(
          <MemoryRouter initialEntries={["/"]}>
            <AppWithThrow />
          </MemoryRouter>
        )
      ).toThrow("Test error");
      jest.resetModules();
    });
  });
});