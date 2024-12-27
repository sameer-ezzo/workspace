import { Component, OnInit } from '@angular/core';

@Component({ standalone: true,
  selector: 'lib-users',
  template: `
    <p>
      users works!
    </p>
  `,
  styles: []
})
export class UsersComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
