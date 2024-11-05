/**
 * @jest-environment jsdom
 */

import mockStore from "../__mocks__/store"
import { screen, waitFor, fireEvent } from "@testing-library/dom"
import "@testing-library/jest-dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import BillsUI from "../views/BillsUI.js"
import { ROUTES_PATH } from "../constants/routes.js"
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
        localStorage: window.localStorage
      })

      const handleChangeFile = jest.fn(newBillInstance.handleChangeFile)
      const inputFile = screen.getByTestId("file")

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()

      inputFile.addEventListener("change", handleChangeFile)

      fireEvent.change(inputFile, {
        target: { files: [] }
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
        localStorage: window.localStorage
      })

      const handleChangeFile = jest.fn(() => newBillInstance.handleChangeFile)
      const inputFile = screen.getByTestId("file")

      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})

      inputFile.addEventListener("change", handleChangeFile)

      fireEvent.change(inputFile, {
        target: {
          files: [new File(["test"], "test.pdf", { type: "image/pdf" })],
        }
      })

      expect(alertSpy).toHaveBeenCalledWith('Veuillez sélectionner un fichier au format jpg, jpeg ou png.')
      alertSpy.mockRestore()
    })
  })

  describe("When I upload a file with valid format", () => {
    test("Then it should update fileUrl and fileName properties", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
  
      const newBillInstance = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })
  
      const handleChangeFile = jest.fn(newBillInstance.handleChangeFile)
      const inputFile = screen.getByTestId("file")

      const validFile = new File(["test"], "test.jpg", { type: "image/jpeg" })

      const storeSpy = jest.spyOn(mockStore.bills(), "create").mockResolvedValue({
        fileUrl: "https://test-url.com/test.jpg",
        key: "12345"
      })
  
      inputFile.addEventListener("change", handleChangeFile)

      fireEvent.change(inputFile, {
        target: { files: [validFile] }
      })

      await waitFor(() => expect(storeSpy).toHaveBeenCalled())

      expect(newBillInstance.fileUrl).toBe("https://test-url.com/test.jpg")
      expect(newBillInstance.fileName).toBe("test.jpg")

      storeSpy.mockRestore()
    })
  })

  describe("When I submit the form completed", () => {
    test("Then the bill is created", () => {
      const newBillInstance = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      const validBill = {
        type: "Transports",
        name: "Vol Paris Londres",
        date: "2024-11-05",
        amount: 500,
        vat: 70,
        pct: 20,
        commentary: "Déplacement pour un client",
        fileUrl: "../img/0.jpg",
        fileName: "test.jpg",
        status: "pending"
      }

      screen.getByTestId("expense-type").value = validBill.type
      screen.getByTestId("expense-name").value = validBill.name
      screen.getByTestId("datepicker").value = validBill.date
      screen.getByTestId("amount").value = validBill.amount
      screen.getByTestId("vat").value = validBill.vat
      screen.getByTestId("pct").value = validBill.pct
      screen.getByTestId("commentary").value = validBill.commentary

      newBillInstance.fileName = validBill.fileName
      newBillInstance.fileUrl = validBill.fileUrl

      newBillInstance.updateBill = jest.fn()
      const handleSubmit = jest.fn((e) => newBillInstance.handleSubmit(e))

      const form = screen.getByTestId("form-new-bill")
      form.addEventListener("submit", handleSubmit)
      fireEvent.submit(form)

      expect(handleSubmit).toHaveBeenCalled()
      expect(newBillInstance.updateBill).toHaveBeenCalled()
    })
  })
  
})

/* TEST D'INTEGRATION */

describe("Given I am a user connected as Employee", () => {
  beforeEach(() => {
    jest.spyOn(mockStore, "bills")
  })

  describe("When I navigate to newBill", () => {
    test("promise from mock API POST returns object bills with correct values", async () => {
      window.onNavigate(ROUTES_PATH.NewBill)

      const bills = await mockStore.bills().create()
      expect(bills.key).toBe("1234")
      expect(bills.fileUrl).toBe("https://localhost:3456/images/test.jpg")
    })

    // Erreur 404
    test("Then fetches bills from an API and fails with 404 message error", async () => {
      window.onNavigate(ROUTES_PATH.NewBill)

      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.reject(new Error("Erreur 404"))
          }
        }
      })

      await new Promise(process.nextTick)
      document.body.innerHTML = BillsUI({ error: "Erreur 404" })
      expect(screen.getByText('Erreur 404')).toBeTruthy()
    })

    // Erreur 500
    test("Then fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.reject(new Error("Erreur 500"))
          },
          list: () => {
            return Promise.resolve([])
          }
        }
      })
      await new Promise(process.nextTick)
      document.body.innerHTML = BillsUI({ error: "Erreur 500" })
      expect(screen.getByText('Erreur 500')).toBeTruthy()
    })
  })
})
