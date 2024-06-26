/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import mockStore from '../__mocks__/store.js';
import NewBillUI from '../views/NewBillUI.js';
import NewBill from '../containers/NewBill.js';
import { ROUTES_PATH } from '../constants/routes.js';
import { localStorageMock } from '../__mocks__/localStorage.js';
import router from '../app/Router.js';
import userEvent from '@testing-library/user-event';

jest.mock('../app/Store', () => mockStore);

describe('When I am on NewBill Page', () => {
	beforeEach(() => {
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
	});

	test('Then mail icon on vertical layout should be highlighted', async () => {
		window.onNavigate(ROUTES_PATH.NewBill);
		await waitFor(() => screen.getByTestId('icon-mail'));
		const Icon = screen.getByTestId('icon-mail');
		expect(Icon).toHaveClass('active-icon');
	});

	describe('When I am on NewBill form', () => {
		let alertSpy;

		beforeEach(() => {
			alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
		});

		afterEach(() => {
			alertSpy.mockRestore();
		});

		test('Then I add valid File', async () => {
			const dashboard = new NewBill({
				document,
				onNavigate,
				store: mockStore,
				localStorage: localStorageMock,
			});

			const handleChangeFile = jest.fn(dashboard.handleChangeFile);
			const inputFile = screen.getByTestId('file');
			inputFile.addEventListener('change', handleChangeFile);
			fireEvent.change(inputFile, {
				target: {
					files: [
						new File(['document.jpg'], 'document.jpg', {
							type: 'image/jpeg',
						}),
					],
				},
			});

			expect(alertSpy).not.toHaveBeenCalled();

			expect(handleChangeFile).toHaveBeenCalled();
			expect(inputFile.files[0].name).toBe('document.jpg');
			expect(dashboard.fileName).toBe('document.jpg');
			expect(dashboard.isImgFormatValid).toBe(true);
			expect(dashboard.formData).not.toBe(null);
		});

		test('Then I add invalid File', async () => {
			const dashboard = new NewBill({
				document,
				onNavigate,
				store: mockStore,
				localStorage: localStorageMock,
			});

			const handleChangeFile = jest.fn(dashboard.handleChangeFile);
			const inputFile = screen.getByTestId('file');
			inputFile.addEventListener('change', handleChangeFile);
			fireEvent.change(inputFile, {
				target: {
					files: [
						new File(['document.pdf'], 'document.pdf', {
							type: 'document/pdf',
						}),
					],
				},
			});

			expect(alertSpy).toHaveBeenCalledWith('Veuillez choisir un fichier de type image');
			expect(handleChangeFile).toHaveBeenCalled();
		});
	});
});

describe('When I am on NewBill Page and submit the form', () => {
	beforeEach(() => {
		jest.spyOn(mockStore, 'bills');
		Object.defineProperty(window, 'localStorage', { value: localStorageMock });
		window.localStorage.setItem(
			'user',
			JSON.stringify({
				type: 'Employee',
				email: 'a@a',
			})
		);
		const root = document.createElement('div');
		root.setAttribute('id', 'root');
		document.body.appendChild(root);
		router();
	});

	describe('user submit form valid', () => {
		test('call api update bills', async () => {
			const form = screen.getByTestId('form-new-bill');
			const inputExpenseType = screen.getByTestId('expense-type');
			const inputExpenseName = screen.getByTestId('expense-name');
			const inputDatepicker = screen.getByTestId('datepicker');
			const inputAmount = screen.getByTestId('amount');
			const inputVAT = screen.getByTestId('vat');
			const inputPCT = screen.getByTestId('pct');
			const inputCommentary = screen.getByTestId('commentary');
			const inputFile = screen.getByTestId('file');

			// Données à insérer
			const inputData = {
				type: 'Transports',
				name: 'Test',
				datepicker: '2024-01-21',
				amount: '1000',
				vat: '20',
				pct: '20',
				commentary: 'Test Data',
				file: new File(['test'], 'test.jpeg', { type: 'image/jpeg' }),
			};

			// Insérer les données simulées
			fireEvent.change(inputExpenseType, {
				target: { value: inputData.type },
			});
			fireEvent.change(inputExpenseName, {
				target: { value: inputData.name },
			});
			fireEvent.change(inputDatepicker, {
				target: { value: inputData.datepicker },
			});
			fireEvent.change(inputAmount, { target: { value: inputData.amount } });
			fireEvent.change(inputVAT, { target: { value: inputData.vat } });
			fireEvent.change(inputPCT, { target: { value: inputData.pct } });
			fireEvent.change(inputCommentary, {
				target: { value: inputData.commentary },
			});
			userEvent.upload(inputFile, inputData.file);

			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname });
			};

			const newBill = new NewBill({
				document,
				onNavigate,
				store: mockStore,
				localStorage: localStorageMock,
			});

			newBill.isImgFormatValid = true;
			const handleSubmit = jest.fn(newBill.handleSubmit);
			form.addEventListener('submit', handleSubmit);
			fireEvent.submit(form);
			expect(mockStore.bills).toHaveBeenCalled();

			// On check la redirection vers la page Bills, ce qui veut dire que le formulaire a bien été submit
			await waitFor(() => screen.getByText('Mes notes de frais'));
			expect(screen.getByText('Mes notes de frais')).toBeTruthy();
		});
	});
});

describe('When I navigate to Dashboard employee', () => {
	describe('Given I am a user connected as Employee, and a user post a newBill', () => {
		test('Add a bill from mock API POST', async () => {
			const postSpy = jest.spyOn(mockStore, 'bills');
			const bill = {
				id: '47qAXb6fIm2zOKkLzMro',
				vat: '80',
				fileUrl:
					'https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a',
				status: 'pending',
				type: 'Hôtel et logement',
				commentary: 'séminaire billed',
				name: 'encore',
				fileName: 'preview-facture-free-201801-pdf-1.jpg',
				date: '2004-04-04',
				amount: 400,
				commentAdmin: 'ok',
				email: 'a@a',
				pct: 20,
			};
			const postBills = await mockStore.bills().update(bill);
			expect(postSpy).toHaveBeenCalled();
			expect(postBills).toStrictEqual(bill);
		});
		describe('When an error occurs on API', () => {
			beforeEach(() => {
				window.localStorage.setItem(
					'user',
					JSON.stringify({
						type: 'Employee',
					})
				);

				document.body.innerHTML = NewBillUI();
			});
			test('Add bills from an API and fails with 404 message error', async () => {
				const postSpy = jest.spyOn(console, 'error');

				const store = {
					bills: jest.fn(() => newBill.store),
					create: jest.fn(() => Promise.resolve({})),
					update: jest.fn(() => Promise.reject(new Error('404'))),
				};

				const newBill = new NewBill({ document, onNavigate, store, localStorage });
				newBill.isImgFormatValid = true;

				const form = screen.getByTestId('form-new-bill');
				const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
				form.addEventListener('submit', handleSubmit);

				fireEvent.submit(form);
				await new Promise(process.nextTick);
				expect(postSpy).toBeCalledWith(new Error('404'));
			});
			test('Add bills from an API and fails with 500 message error', async () => {
				const postSpy = jest.spyOn(console, 'error');

				const store = {
					bills: jest.fn(() => newBill.store),
					create: jest.fn(() => Promise.resolve({})),
					update: jest.fn(() => Promise.reject(new Error('500'))),
				};

				const newBill = new NewBill({ document, onNavigate, store, localStorage });
				newBill.isImgFormatValid = true;

				const form = screen.getByTestId('form-new-bill');
				const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
				form.addEventListener('submit', handleSubmit);

				fireEvent.submit(form);
				await new Promise(process.nextTick);
				expect(postSpy).toBeCalledWith(new Error('500'));
			});
		});
	});
});
