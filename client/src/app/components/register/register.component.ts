import { Component, OnInit } from '@angular/core';
import { FormGroup,FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})

export class RegisterComponent implements OnInit {
  
  registerForm = new FormGroup({
    name: new FormControl(''),
    email: new FormControl(''),
    gender : new FormControl(''),
    username: new FormControl(''),
    password : new FormControl(''),
    confirmPassword: new FormControl('')
  });

  isAlpha(text: string) {
    var letters = /^[A-Za-z]+$/
    if(text.match(letters)) {
      return true
    }
    return false
  }

  validateEmail(mail: string) {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
      return true
    }
    return false
  }

  validatePass(pass: string) {
    var passw=  /^[A-Za-z]\w{7,14}$/;
    if (pass.match(passw)) { 
      return true;
    } else { 
      return false;
    }
  }

  validateUser(user: string) {
    var userTmp = /^[a-z0-9_-]{3,16}$/;
    if (user.match(userTmp)) {
      return true
    } else {
      return false
    }
  }

  validation(valName: string, valEmail: string, valUser: string, valPass: string, valConf: string) {
    // Name validation
    var splitValName = valName.split(' ')
    if (splitValName.length == 2) {
      if (this.isAlpha(splitValName[0]) && this.isAlpha(splitValName[1])) {
        console.log('Full name validated.\n')
      } else {
        alert('Full name is not valid. Only alphabets are allowed.')
        return false
      }
    } else {
      alert('Please enter first name as well as last name.')
      return false
    }

    // Email validation
    if (this.validateEmail(valEmail)) {
      console.log('Email validated.\n')
    } else {
      alert('Please enter a valid email address.')
      return false
    }

    // Username validation
    if (this.validateUser(valUser)) {
      console.log('Username validated.\n')
    } else {
      alert('Please enter a valid username.')
      return false
    }

    // Password validation
    if (this.validatePass(valPass)) {
      console.log('Password validated.\n')
    } else {
      alert('Please enter a valid password.')
      return false
    }

    if (valPass == valConf) {
      console.log('Password confirmed.')
    } else {
      alert('Password and Confirm Password are not matching.')
      return false
    }

    return true
  }

  onSubmit() {
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded"
    }

    var formValues = this.registerForm.value

    if ( this.validation(formValues['name'], formValues['email'], formValues['username'], formValues['password'], formValues['confirmPassword']) ) {
      console.log('User details validated successfully.')
      this.http.post('http://localhost:3000/api/register',formValues,{headers})
        .subscribe(response => {
          console.log(response);
          confirm("Registration success");
        },
        err => {
          alert("user exists already");
        }
      )
    }
  }
  
  constructor(private http: HttpClient) { }

  ngOnInit(): void { }

  highlight(event: any): void {
    event.target.style['border-bottom'] = "1px solid rgba(30, 40, 51, 0.9)";      
    event.target.style['opacity'] = "0.9";           
  }

  dampen(event: any): void {
    event.target.style['border-bottom'] = "1px solid rgba(30, 40, 51, 0.6)";      
    event.target.style['opacity'] = "0.6";           
  }
}
