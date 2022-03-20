import { Component, OnInit } from '@angular/core';
import { FormGroup,FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {Router} from '@angular/router'
import{ GlobalConstants } from '../../common/global-constants';
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
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded"
    }

    var post = this.http.post(GlobalConstants.apiURL+'login',this.loginForm.value,{headers});
    console.log(post);

    post.subscribe(
      Response => {
        console.log(Response);
        new GlobalConstants().setUserInfo({'name': 'Rishabh Jaiswal', 'gender': 'M'});
        this.router.navigate(['/services']);
      },
      error => {
        alert('Login failed!')
      }
    );
  }
  
  constructor(private http: HttpClient,public router:Router) { }

  ngOnInit(): void { }

}
