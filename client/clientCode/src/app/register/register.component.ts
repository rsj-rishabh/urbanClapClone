import { Component, OnInit } from '@angular/core';
import { FormGroup,FormControl } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm = new FormGroup({
    firstname: new FormControl(''),
    lastname: new FormControl(''),
    email: new FormControl(''),
    phone: new FormControl(''),
    username : new FormControl(''),
    password : new FormControl(''),
  });

  onSubmit() {
    console.warn(this.registerForm.value);
  }
  constructor() { }

  ngOnInit(): void {
  }

}
