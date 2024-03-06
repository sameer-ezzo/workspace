

// import passport from 'passport';
// router.use(passport.initialize());

// async function authCallback(req: any, res: any) {
// 	const access_token = await authService.issueAccessToken((<any>req).user);
// 	const refresh_token = await authService.issueRefreshToken((<any>req).user);
// 	return res.redirect(`${env.client_url ?? ''}/login?access_token=${access_token}&refresh_token=${refresh_token}`);
// }

// router.get('/auth/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/userinfo.email'] }));
// router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: `${env.client_url ?? ''}/login?from=google` }), (req, res) => authCallback(req, res));

// router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['public_profile', 'email'] }));
// router.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: `${env.client_url ?? ''}/login?from=facebook` }), (req, res) => authCallback(req, res));



