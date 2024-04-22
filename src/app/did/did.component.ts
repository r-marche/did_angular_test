import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Client, DIDSet, Wallet } from 'xrpl';
import { DidService } from '../services/did.service';
import { WalletService } from '../services/wallet.service';


@Component({
	selector: 'app-did',
	standalone: true,
	imports: [],
	templateUrl: './did.component.html',
	styleUrl: './did.component.css'
})
export class DidComponent {
	
	readonly net = 'wss://s.altnet.rippletest.net:51233';
	
	wallet: any;
	balance: any;

	data: any;
	didDoc: any;
	transaction: any;


	constructor(
		private router: Router, 
		private walletService: WalletService,
		private didService: DidService
	) {	}

	ngOnInit() {

		// Getters
		this.wallet = this.walletService.getWallet();

		this.data = this.didService.getData();
		this.didDoc = this.didService.getDidDocument();
		this.transaction = this.didService.getTransaction();
		
		// Setters
		this.getBalance(this.wallet.classicAddress);

		this.didDoc.id = "did:xrpl:1:" + this.wallet.classicAddress;
		this.didDoc.publicKey.id = "did:xrpl:1:" + this.wallet.classicAddress;
		
		this.transaction['Account'] = this.wallet.classicAddress;
	}

	/**
	 * Gets balance from the given wallet and saves it in this.balance.
	 */
	async getBalance(address: string) {

		// Connecting to Client
		const client = new Client(this.net);
		await client.connect();

		this.balance = await client.getXrpBalance(address);

		// Disconnecting from client
		client.disconnect();
	}

	/**
	 * Fills the data fields accordingly to what has been specified in the HTML
	 * inputs and returns the JSON as string.
	 */
	fillData(): string {
		return JSON.stringify(this.data);
	}

	/**
	 * Fills the DiD Document and returns it as a string. The created document
	 * follows the specification suggested in 'https://www.w3.org/TR/did-core'.
	 * NB: NetworkID is set to '1' since we are working on the Testnet (see
	 * xrpl.org/docs/references/protocol/transactions/common-fields/#networkid-field)
	 * Input:
	 * - type: string. The type of operation which the document refers to; can be
	 *   of three types: 0 --> 'created', 1 --> 'updated', 2 --> 'deactivated'.
	 * 
	 * TODO: Move from JSON to JSON-LD
	 */
	fillDidDocument(type: number): string {

		// Checking input's validity
		if (![0, 1, 2].includes(type)) {
			
			console.error('Selected type ' + type + ' is not valid.');
			return ''; 
		}

		const isoDateTime = this.didService.getUTC00DateTime();	//Current datetime

		// Setting fields
		switch(type) {
			case 0:
				this.didDoc.metadata['created'] = isoDateTime;
				this.didDoc.publicKey['publicKeyHex'] = this.wallet.publicKey;
				break;
			case 1:
				this.didDoc.metadata['updated'] = isoDateTime;
				break;
			case 2:
				this.didDoc.metadata['deactivated'] = isoDateTime;
				break;
		}

		// Checking validity
		const didDoc = JSON.stringify(this.didDoc);
		const validDidDoc = this.didService.checkBytes(didDoc);

		if(validDidDoc) {
			return didDoc;
		} else {
			console.error('DiD document length exceedes max length (256 bytes).');
			return '';
		}
	}

	/**
	 * Implementation of the DIDSet transation. 
	 */
	async setDiD() {
		
		// Connecting to Client
		const client = new Client(this.net);
		await client.connect();
		console.log('Client connected...');

		console.log(this.didService.jsonToURI(JSON.stringify(this.data)));

		// Preparing transaction
		this.transaction['TransactionType'] = 'DIDSet';

		/*
		// Submitting transation
		try {
			const result = await client.submit(setDiD, this.wallet);
			console.log(result)
		} catch (error) {
			console.error(`Failed to submit transaction: ${error}`)
		}
		*/

		// Disconnecting from client
		client.disconnect();
		console.log('...Client disconnected.')
	}

	/**
	 * Implementation of the DIDDelete transaction.
	 */
	async deleteDiD() {
		
		// Connecting to Client
		const client = new Client(this.net);
		await client.connect();

		// Preparing transation
		// ...

		// Submitting transaction
		// ...

		// Disconnecting from client
		client.disconnect();
	}

	logout() {
		this.router.navigateByUrl('/home');
	}
}