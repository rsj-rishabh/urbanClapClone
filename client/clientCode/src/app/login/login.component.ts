import { Component, OnInit } from '@angular/core';
import { FormGroup,FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

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
  loginData = [];

  onSubmit() {
    this.http.get<any>('http://localhost:3000/user/nancy').subscribe(data => {
      this.loginData = data;
  })
    console.warn(this.loginData);

  }
  
  constructor(private http: HttpClient) { }

  ngOnInit(): void {
  }

}
