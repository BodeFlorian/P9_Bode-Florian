/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from '@testing-library/dom';
import BillsUI from '../views/BillsUI.js';
import { bills } from '../fixtures/bills.js';
import { ROUTES, ROUTES_PATH } from '../constants/routes.js';
import { localStorageMock } from '../__mocks__/localStorage.js';
import mockedStore from '../__mocks__/store';
import Bills from '../containers/Bills.js';
import userEvent from '@testing-library/user-event';
import router from '../app/Router.js';

jest.mock('../app/store', () => mockedStore);

describe('Given I am connected as an employee', () => {
	describe('When I am on Bills Page', () => {
		test('Then bill icon in vertical layout should be highlighted', async () => {
			Object.defineProperty(window, 'localStorage', { value: localStorageMock });
			window.localStorage.setItem(
				'user',
				JSON.stringify({
					type: 'Employee',
				})
			);
			const root = document.createElement('div');
			root.setAttribute('id', 'root');
			document.body.append(root);
			router();
			window.onNavigate(ROUTES_PATH.Bills);
			await waitFor(() => screen.getByTestId('icon-window'));
			const windowIcon = screen.getByTestId('icon-window');

			// On vérifie que l'icône est surlignée
			expect(windowIcon.classList.contains('active-icon')).toBe(true);
		});
		test('Then bills should be ordered from earliest to latest', () => {
			document.body.innerHTML = BillsUI({ data: bills });
			const dates = screen
				.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
				.map((a) => a.innerHTML);
			const antiChrono = (a, b) => (a < b ? 1 : -1);
			const datesSorted = [...dates].sort(antiChrono);
			expect(dates).toEqual(datesSorted);
		});
	});

	describe('When I click on New Bill Button', () => {
		test('Then we sould be redirect on New Bill form', () => {
			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname });
			};

			Object.defineProperty(window, 'localStorage', {
				value: localStorageMock,
			});

			window.localStorage.setItem(
				// On simule un employé
				'user',
				JSON.stringify({
					type: 'Employee',
				})
			);

			const bills = new Bills({
				// On ajoute des bills
				document,
				onNavigate,
				store: mockedStore,
				localStorage: window.localStorage,
			});

			const buttonNewBill = screen.getByRole('button', {
				// On recup le bouton pour ajouter des bills
				name: /nouvelle note de frais/i,
			});

			// On verifie que le bouton est present
			expect(buttonNewBill).toBeTruthy();

			// Ajoute les evenements au clique
			const handleClickNewBill = jest.fn(bills.handleClickNewBill);
			buttonNewBill.addEventListener('click', handleClickNewBill);
			userEvent.click(buttonNewBill);

			// On verifie que la methode handleClickNewBill => Si oui, le test est bon
			expect(handleClickNewBill).toHaveBeenCalled();
		});
	});

	describe('When I click on the icon eye', () => {
		test('A modal should open', async () => {
			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname });
			};

			Object.defineProperty(window, 'localStorage', {
				value: localStorageMock,
			});

			window.localStorage.setItem(
				'user',
				JSON.stringify({
					type: 'Employee',
				})
			);

			const billsDashboard = new Bills({
				document,
				onNavigate,
				store: null,
				bills: bills,
				localStorage: window.localStorage,
			});

			// Simule un modal
			$.fn.modal = jest.fn();

			// Genere les bills sur le body
			document.body.innerHTML = BillsUI({ data: bills });

			// Sélectionne la première icône "eye" pour afficher la modal
			const iconEye = screen.getAllByTestId('icon-eye')[0];

			const handleClickIconEye = jest.fn(() => billsDashboard.handleClickIconEye(iconEye));
			iconEye.addEventListener('click', handleClickIconEye);
			userEvent.click(iconEye);

			expect(handleClickIconEye).toHaveBeenCalled();
			expect($.fn.modal).toHaveBeenCalled();

			// Vérifie que la modal est affichée
			await waitFor(() => {
				expect(screen.getByTestId('modal')).toBeTruthy();
			});
		});
	});
});
