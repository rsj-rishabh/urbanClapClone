import { Component, OnInit } from '@angular/core';
import { FormGroup,FormControl } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm = new FormGroup({
    username : new FormControl(''),
    password : new FormControl(''),
  });

  onSubmit() {
    console.warn(this.loginForm.value);
  }
  
  constructor() { }

  ngOnInit(): void {
  }

}
