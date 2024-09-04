import axios from "axios";

const purchaseConfirmBySms = async ({

    mobile,
    totalAmount,
    dueAmount,
    shopName,
}:{
    mobile: string;
    totalAmount: number;
    dueAmount: number;
    shopName: string;
})=>{
// at first check if the user exists

try {
    const smsPost = await axios.get(
        `http://bulksmsbd.net/api/smsapi?api_key=3CuemU2YW4dCNqDJulbJ&type=text&number=88${'01646653053'}&senderid=8809617618303&message=Your Manager.com 
        দোকানের নাম: ${shopName}
        মোট পণ্য ক্রয়: ${totalAmount} টাকা
        বকেয়া আছে: ${dueAmount} টাকা
        `
      );
     console.log({
      data: smsPost.data,
  })

} catch (error) {

    console.log({
        error
    })
    
}
 
}

export default purchaseConfirmBySms;