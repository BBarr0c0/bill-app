/**
 * @jest-environment jsdom
 */

import mockedStore from '../__mocks__/store'
import {screen, waitFor} from "@testing-library/dom"
import "@testing-library/jest-dom"
import userAction from "@testing-library/user-event"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from '../containers/Bills.js'
import { ROUTES_PATH} from "../constants/routes.js"
import {localStorageMock} from "../__mocks__/localStorage.js"
import router from "../app/Router.js"

jest.mock("../app/Store", () => mockedStore);

beforeEach(() => {
  Object.defineProperty(window, "localStorage", { value: localStorageMock });
  window.localStorage.setItem('user', JSON.stringify({
    type: 'Employee'
  }))

  const root = document.createElement("div")
  root.setAttribute("id", "root")
  document.body.appendChild(root)
  router()
})

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {

    test("Then bill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon).toHaveClass('active-icon')
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => new Date(b.date) - new Date(a.date)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test("Then clicking on 'New Bill' button should navigate to the NewBill page", async () => {
      window.onNavigate(ROUTES_PATH.Bills)

      const billsInstance = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })

      await waitFor(() => screen.getByTestId("btn-new-bill"))
      const btnNewBill = screen.getByTestId("btn-new-bill")

      const handleClickNewBill = jest.fn(() =>
        billsInstance.handleClickNewBill()
      );

      btnNewBill.addEventListener("click", handleClickNewBill)

      userAction.click(btnNewBill)

      expect(handleClickNewBill).toHaveBeenCalled()
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()
    })

    test("Then clicking on a eye icon should display a modal", () => {
      document.body.innerHTML = BillsUI({ data: bills })

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const billsInstance = new Bills({
        document,
        onNavigate,
        localStorage: localStorageMock,
        store: null,
      })

      const iconEyes = screen.getAllByTestId('icon-eye')

      const handleClickIconEye = jest.fn( billsInstance.handleClickIconEye )

      const modale = document.getElementById('modaleFile')

      $.fn.modal = jest.fn(() => modale.classList.add('show'))

      iconEyes.forEach((iconEye) => {
        iconEye.addEventListener('click', () =>
          handleClickIconEye(iconEye),
        );
        userAction.click(iconEye);

        expect(handleClickIconEye).toHaveBeenCalled()

        expect(modale).toHaveClass('show');
      })
    })
  })
})

/* TEST D'INTEGRATION GET BILLS */

describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    beforeEach(() => {
      jest.spyOn(mockedStore, "bills")
    })

    test("fetches bills from mock API GET", async () => {
      window.onNavigate(ROUTES_PATH.Bills)
      const bills = await mockedStore.bills().list()
      expect(await waitFor(() => screen.getByTestId("tbody"))).toBeTruthy()
      expect(bills.length).toBe(4)
    })

    test("Then fetches bills from an API and fails with 404 message error", async () => {
      mockedStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"))
          },
        }
      })
      const html = BillsUI({ error: "Erreur 404" })
      document.body.innerHTML = html
      const message = screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("Then fetches messages from an API and fails with 500 message error", async () => {
      mockedStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"))
          },
        }
      })
      const html = BillsUI({ error: "Erreur 500" })
      document.body.innerHTML = html;
      const message = screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})
