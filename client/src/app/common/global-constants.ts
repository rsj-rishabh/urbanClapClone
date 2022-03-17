export class GlobalConstants {
    public static apiURL: string = "http://localhost:3000/api/";

    public firstName: string = "firstName";
    public lastName: string = "lastName";
    public gender: string = "gender";

    /**
     * setUserInfo
     */
    setUserInfo(info: { name: string; gender: string; } | null) {
        if (info !== null) {
            this.firstName = info.name.split(' ')[0];
            this.lastName = info.name.split(' ')[1];
            this.gender = info.gender;
        }
        console.log('[Golbal Constants]: user info for '+this.firstName+' '+this.lastName+' is set to '+this.gender);
    }
}