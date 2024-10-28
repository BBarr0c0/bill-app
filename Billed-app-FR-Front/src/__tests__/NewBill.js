/**
 * @jest-environment jsdom
 */

import mockStore from "../__mocks__/store"
import { screen, fireEvent } from "@testing-library/dom"
import "@testing-library/jest-dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import BillsUI from "../views/BillsUI.js"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import router from "../app/Router.js"

jest.mock("../app/Store", () => mockStore)

beforeEach(() => {
  const html = NewBillUI()
  document.body.innerHTML = html

  localStorage.setItem(
    "user",
    JSON.stringify({ type: "Employee", email: "test@email.com" })
  )
  const root = document.createElement("div")
  root.setAttribute("id", "root")
  document.body.append(root)
  router()
})

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then NewBill should be render", () => {
      
      //to-do write assertion
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy()
    })
  })

  describe("When no file is selected", () => {
    test("Then it should log an error and not proceed further", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const newBillInstance = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })

      const handleChangeFile = jest.fn(newBillInstance.handleChangeFile)
      const inputFile = screen.getByTestId("file")

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()

      inputFile.addEventListener("change", handleChangeFile)

      fireEvent.change(inputFile, {
        target: { files: [] },
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith(new Error("No file selected"))
      consoleErrorSpy.mockRestore()
    })
  })

  describe("When I upload a file with invalid format", () => {
    test("Then it should display an error message", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const newBillInstance = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })

      const handleChangeFile = jest.fn(() => newBillInstance.handleChangeFile)
      const inputFile = screen.getByTestId("file")

      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})

      inputFile.addEventListener("change", handleChangeFile)

      fireEvent.change(inputFile, {
        target: {
          files: [new File(["test"], "test.pdf", { type: "image/pdf" })],
        },
      })

      expect(alertSpy).toHaveBeenCalledWith('Veuillez sélectionner un fichier au format jpg, jpeg ou png.')
      alertSpy.mockRestore()
    })
  })

})
