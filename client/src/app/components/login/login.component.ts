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
      data => {
        console.log(data);
        localStorage.setItem('id', data['id' as keyof typeof data].toString())
        localStorage.setItem('name', data['name' as keyof typeof data].toString())
        localStorage.setItem('username', data['username' as keyof typeof data].toString())
        localStorage.setItem('password', data['password' as keyof typeof data].toString())
        localStorage.setItem('email', data['email' as keyof typeof data].toString())
        localStorage.setItem('gender', data['gender' as keyof typeof data].toString())
        localStorage.setItem('isLoggedIn', 'true')
        this.router.navigate(['/services']).then(() => {
          window.location.reload();
        });;
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

  highlight(event: any): void {
    event.target.style['border-bottom'] = "1px solid rgba(30, 40, 51, 0.9)";      
    event.target.style['opacity'] = "0.9";           
  }

  dampen(event: any): void {
    event.target.style['border-bottom'] = "1px solid rgba(30, 40, 51, 0.6)";      
    event.target.style['opacity'] = "0.6";           
  }

}
