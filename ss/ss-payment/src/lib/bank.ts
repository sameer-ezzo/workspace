
export class Bank {
    constructor(public type: string,
        public code: string,
        public color: string,
        public localTitle: string,
        public engTitle: string,
        public name: string,
        public country: string,
        public url: string
    ) { }

    static getBank(cardNumber: string): Bank | undefined { //TODO implement based on some cdn data
        const bank: any = new Bank('', '', '', '', '', '', '', '');
        // const result = banksDB(cardNumber);
        // if (result) {
        //     Object.keys(bank).forEach(k => bank[k] = result[k]);
        //     return bank;
        // }
        return undefined;
    }
} 