import { Component, OnInit } from '@angular/core';
import { FormGroup,FormControl } from '@angular/forms';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import {HttpClientModule} from '@angular/common/http';
import { map } from 'rxjs/operators';

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
    this.http.get('http://localhost:3000/user/'+this.loginForm.value.username, {responseType:'json', observe:'response'})
    .subscribe(response => {
      if(response.status == 200)
        alert("login success");
    },
    err => {
      alert("user does not exist");
    }
    )
    
  }
  
  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    
  }

}
