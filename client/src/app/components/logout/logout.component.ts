import { Component, OnInit } from '@angular/core';
import { FormGroup,FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'
import { GlobalConstants } from '../../common/global-constants';
import { AppComponent } from 'src/app/app.component';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html'
})

export class LogoutComponent implements OnInit {
  isLoggedIn = localStorage.getItem('isLoggedIn')
  
  constructor(private http: HttpClient,public router:Router) { }

  ngOnInit(): void {
    this.isLoggedIn = localStorage.getItem('isLoggedIn')

    if (this.isLoggedIn == 'true') {
        localStorage.setItem('id', '')
        localStorage.setItem('name', '')
        localStorage.setItem('username', '')
        localStorage.setItem('password', '')
        localStorage.setItem('email', '')
        localStorage.setItem('gender', '')
        localStorage.setItem('isLoggedIn', 'false')
        this.router.navigate(['/home']).then(() => {
          window.location.reload();
        });;
    } else {
        console.log('User is already logged out.')
    }

  }

}