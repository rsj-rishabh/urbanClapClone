import { Component, OnInit } from '@angular/core';
import { FormGroup,FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'
import { GlobalConstants } from '../../common/global-constants';
import { AppComponent } from 'src/app/app.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {
  isLoggedIn = localStorage.getItem('isLoggedIn')
  
  loginForm = new FormGroup({
    username : new FormControl(''),
    password : new FormControl(''),
  });

  onSubmit() {
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded"
    }

    var post = this.http.post(GlobalConstants.apiURL+'login',this.loginForm.value,{headers});
    console.log(post);

    post.subscribe(
      Response => {
        console.log(Response);
        new GlobalConstants().setUserInfo({'name': 'Rishabh Jaiswal', 'gender': 'M'});
        localStorage.setItem('isLoggedIn', 'true');
        this.router.navigate(['/services']);
      },
      error => {
        alert('Login failed!')
      }
    );
  }
  
  constructor(private http: HttpClient,public router:Router) { }

  ngOnInit(): void {
    this.isLoggedIn = localStorage.getItem('isLoggedIn')
    if (this.isLoggedIn == 'true') {
      this.router.navigate(['/services']);
    }
  }

}
